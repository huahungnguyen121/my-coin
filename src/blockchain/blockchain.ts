import { SHA256 } from "crypto-js";
import _ from "lodash";
import { BLOCKCHAIN_DEFAULT_CONFIGS } from "../constants/common-constants";
import { minuteToMilisec } from "../utils";

export class Transaction {
    private data: any;

    constructor(data: any) {
        this.data = data;
    }

    stringify() {
        return JSON.stringify(this.data);
    }
}

export class Block {
    index: number;
    hash: string;
    prevHash: string;
    transaction: Transaction;
    timestamp: Date | null;
    difficulty: number;
    nonce: number;

    constructor(
        index: number,
        transaction: Transaction,
        difficulty: number,
        nonce?: number,
        hash?: string,
        prevHash?: string
    ) {
        this.index = index;
        this.prevHash = prevHash ? prevHash : "";
        this.transaction = transaction;
        this.timestamp = index === 0 && _.isEqual(transaction, new Transaction(null)) ? null : new Date();
        this.difficulty = difficulty;
        this.nonce = nonce ? nonce : 0;
        this.hash = hash ? hash : this.calcHash();
    }

    static genesisBlock = new Block(0, new Transaction(null), 0, 0);

    calcHash() {
        while (true) {
            const tempHash = SHA256(
                this.index +
                    this.prevHash +
                    (this.timestamp === null ? "" : this.timestamp.toISOString()) +
                    this.transaction.stringify() +
                    this.difficulty +
                    this.nonce
            ).toString();

            if (tempHash.startsWith("0".repeat(this.difficulty))) return tempHash;

            ++this.nonce;
        }
    }
}

export class Blockchain {
    private chain: Block[];
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
        const newBlock = new Block(index, transaction, this.getDifficulty(), undefined, undefined, prevHash);
        return newBlock;
    }

    addBlock(block: Block) {
        if (!block) return false;

        const lastestIndex = this.chain.length - 1;

        if (this.chain[lastestIndex].hash !== block.prevHash) return false;

        this.chain.push(_.cloneDeep(block));

        return true;
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

                if (currentBlock.timestamp.valueOf() - prevBlock.timestamp.valueOf() < 0) return false;
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
                minuteToMilisec(this.configs.BLOCK_GENERATION_INTERVAL) * this.configs.DIFFICULTY_ADJUSTMENT_INTERVAL;
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
}
