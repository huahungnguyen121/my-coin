import { SHA256 } from "crypto-js";
import _ from "lodash";
import { BLOCKCHAIN_DEFAULT_CONFIGS, MESSAGE_TYPE } from "../constants/common-constants";
import { buildMsg, secondToMilisec } from "../utils";
import { Transaction, UnspentTransactionOut, findUnspentTxOut } from "./transaction";
import { createTransaction, getBalance, getPrivateFromWallet, getPublicFromWallet } from "../wallet";
import { broadcast } from "..";

export class Block {
    index: number;
    hash: string;
    prevHash: string;
    transaction: Transaction[] | null;
    timestamp: Date | null;
    difficulty: number;
    nonce: number;

    constructor(
        index: number,
        transaction: Transaction[] | null,
        difficulty: number,
        nonce?: number,
        hash?: string,
        prevHash?: string
    ) {
        this.index = index;
        this.prevHash = prevHash ? prevHash : "";
        this.transaction = transaction;
        this.timestamp = index === 0 && this.transaction === null ? null : new Date();
        this.difficulty = difficulty;
        this.nonce = nonce ? nonce : 0;
        this.hash = hash ? hash : "";
    }

    static genesisBlock = new Block(0, null, 0, 0);

    calcHash() {
        while (true) {
            const tempHash = SHA256(
                this.index +
                    this.prevHash +
                    (this.timestamp === null ? "" : this.timestamp.toISOString()) +
                    (this.transaction === null ? "" : Transaction.stringify(this.transaction)) +
                    this.difficulty +
                    this.nonce
            ).toString();

            if (tempHash.startsWith("0".repeat(this.difficulty))) return tempHash;

            ++this.nonce;
        }
    }

    mine() {
        this.hash = this.calcHash();
    }

    isValidBlockStructure(): boolean {
        return (
            typeof this.index === "number" &&
            typeof this.hash === "string" &&
            typeof this.prevHash === "string" &&
            typeof this.timestamp === "object" &&
            typeof this.transaction === "object"
        );
    }

    isValidNewBlock(previousBlock: Block): boolean {
        if (!this.isValidBlockStructure()) {
            console.log("Invalid block structure");
            console.log(this);
            return false;
        }

        if (previousBlock.index + 1 !== this.index) {
            console.log("Invalid index");
            return false;
        }

        if (previousBlock.hash !== this.prevHash) {
            console.log("Invalid previous hash");
            return false;
        }

        if (this.calcHash() !== this.hash) {
            console.log("Invalid hash");
            return false;
        }

        return true;
    }
}

export class Blockchain {
    private chain: Block[];
    private unspentTxOuts: UnspentTransactionOut[] = [];
    private configs: typeof BLOCKCHAIN_DEFAULT_CONFIGS;

    constructor(blockchain?: Block[], configs: typeof BLOCKCHAIN_DEFAULT_CONFIGS = BLOCKCHAIN_DEFAULT_CONFIGS) {
        if (Array.isArray(blockchain)) {
            if (!Blockchain.isValidChain(blockchain)) {
                this.chain = [Block.genesisBlock];
                this.configs = configs;
                return;
            }

            this.configs = configs;
            this.chain = blockchain;
            return;
        }

        this.configs = configs;
        this.chain = [Block.genesisBlock];
    }

    mineBlock(transaction: Transaction) {
        const index = this.chain.length;
        const prevHash = this.chain[index - 1].hash;
        const newBlock = new Block(index, [transaction], this.getDifficulty(), undefined, undefined, prevHash);
        return newBlock;
    }

    addBlock(block: Block) {
        if (!block) return false;

        if (!block.isValidNewBlock(this.chain[this.chain.length - 1])) return false;

        if (block.transaction === null) return false;

        this.processTransactions(block.transaction, block.index);

        this.chain.push(_.cloneDeep(block));

        return true;
    }

    generateNextRawBlock(transactions: Transaction[]): Block | null {
        const previousBlock: Block = this.chain[this.chain.length - 1];
        const difficulty = this.getDifficulty();
        const nextIndex = previousBlock.index + 1;
        const newBlock: Block = new Block(
            nextIndex,
            transactions,
            difficulty,
            undefined,
            undefined,
            previousBlock.hash
        );
        newBlock.mine();

        if (this.addBlock(newBlock)) {
            broadcast(buildMsg(MESSAGE_TYPE.RECEIVE_CHAIN, [newBlock]));
            return newBlock;
        }

        return null;
    }

    static isValidChain(blockchain: Block[]) {
        // is an array of blocks
        if (!Array.isArray(blockchain)) return false;

        // not an empty chain
        if (blockchain.length === 0) return false;

        // unknown genesis block
        if (!_.isEqual(Block.genesisBlock, blockchain[0])) return false;

        // check the chain
        for (let i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];

            if (currentBlock.prevHash !== prevBlock.hash) return false;

            if (currentBlock.hash !== currentBlock.calcHash()) return false;

            // avoid genesis block
            if (prevBlock.index !== 0) {
                if (prevBlock.timestamp === null || currentBlock.timestamp === null) return false;

                // timestamps of blocks have to be in ascending order
                if (currentBlock.timestamp.valueOf() - prevBlock.timestamp.valueOf() < 0) return false;

                // allow maximum 1-minute gap between 2 blocks
                if (currentBlock.timestamp.valueOf() - prevBlock.timestamp.valueOf() > secondToMilisec(60))
                    return false;
            }
        }

        return true;
    }

    static getCumulativeDifficulty(blockchain: Block[]): number {
        let cumulativeDifficulty = 0;
        blockchain.forEach((block) => {
            cumulativeDifficulty += Math.pow(2, block.difficulty);
        });

        return cumulativeDifficulty;
    }

    // A valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
    static isValidAddress = (address: string): boolean => {
        if (address.length !== 130) {
            console.log(address);
            console.log("Invalid public key length");
            return false;
        } else if (address.match("^[a-fA-F0-9]+$") === null) {
            console.log("Public key must contain only hex characters");
            return false;
        } else if (!address.startsWith("04")) {
            console.log("Public key must start with 04");
            return false;
        }
        return true;
    };

    generateNextBlock() {
        const coinbaseTx: Transaction = Transaction.getCoinbaseTransaction(
            getPublicFromWallet(),
            this.chain[this.chain.length - 1].index + 1
        );
        const blockData: Transaction[] = [coinbaseTx];

        return this.generateNextRawBlock(blockData);
    }

    generateNextBlockWithTransaction = (receiverAddress: string, amount: number) => {
        if (!Blockchain.isValidAddress(receiverAddress)) {
            throw Error("Invalid receiver's address");
        }

        if (typeof amount !== "number" || isNaN(amount)) {
            throw Error("Invalid amount");
        }

        const coinbaseTx: Transaction = Transaction.getCoinbaseTransaction(
            getPublicFromWallet(),
            this.chain[this.chain.length - 1].index + 1
        );

        const tx: Transaction = createTransaction(receiverAddress, amount, getPrivateFromWallet(), this.unspentTxOuts);
        const blockData: Transaction[] = [coinbaseTx, tx];
        return this.generateNextRawBlock(blockData);
    };

    replaceChain(blockchain: Block[]) {
        if (!Blockchain.isValidChain(blockchain)) return false;

        if (Blockchain.getCumulativeDifficulty(this.chain) > Blockchain.getCumulativeDifficulty(blockchain))
            return false;

        this.chain = _.cloneDeep(blockchain);
        return true;
    }

    private getDifficulty() {
        const latestBlock = this.chain[this.chain.length - 1];
        // if reached the interval to adjust the difficulty (n blocks interval)
        if (latestBlock.index % this.configs.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
            const latestAdjustedBlock = this.chain[this.chain.length - this.configs.DIFFICULTY_ADJUSTMENT_INTERVAL];
            const expectedTime =
                secondToMilisec(this.configs.BLOCK_GENERATION_INTERVAL) * this.configs.DIFFICULTY_ADJUSTMENT_INTERVAL;
            const actualTime =
                (latestBlock.timestamp as Date).valueOf() - (latestAdjustedBlock.timestamp as Date).valueOf();

            let adjustDifficulty = 0;
            if (actualTime > expectedTime * 2) adjustDifficulty = -1;
            if (actualTime < expectedTime / 2) adjustDifficulty = 1;

            return latestAdjustedBlock.difficulty + adjustDifficulty;
        }

        return latestBlock.difficulty;
    }

    getChain() {
        return _.cloneDeep(this.chain);
    }

    processTransactions(transactions: Transaction[], blockIndex: number) {
        if (!Transaction.isValidTransactionsStructure(transactions)) {
            return null;
        }

        if (!Transaction.validateBlockTransactions(transactions, this.unspentTxOuts, blockIndex)) {
            console.log("Invalid block transactions");
            return null;
        }

        this.updateUnspentTxOuts(transactions);
    }

    // methods for unspent transaction outs
    updateUnspentTxOuts(transactions: Transaction[]) {
        const consumedTxOuts = transactions.map((tx) => tx.transactionIns).reduce((prev, cur) => prev.concat(cur), []);
        const newUnspentTxOuts = transactions
            .map((tx) =>
                tx.transactionOuts.map(
                    (txOut, index) => new UnspentTransactionOut(tx.id, index, txOut.address, txOut.amount)
                )
            )
            .reduce((prev, cur) => prev.concat(cur));

        this.unspentTxOuts = this.unspentTxOuts
            .filter(
                (uTxOut) =>
                    !consumedTxOuts.some(
                        (cTxO) =>
                            cTxO.transactionOutId === uTxOut.transactionOutId &&
                            cTxO.transactionOutIndex === uTxOut.transactionOutIndex
                    )
            )
            .concat(newUnspentTxOuts);
    }

    getAccountBalance = (): number => {
        return getBalance(getPublicFromWallet(), this.unspentTxOuts);
    };
}
