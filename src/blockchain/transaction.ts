import { SHA256 } from "crypto-js";
import { ec, getPublicKeyFromPrivateKey } from "../keygen";
import { hasDuplicates, toHexString } from "../utils";
import { Blockchain } from "./blockchain";
import _ from "lodash";

export const findUnspentTxOut = (
    transactionId: string,
    transactionIndex: number,
    unspentTxOuts: UnspentTransactionOut[]
): UnspentTransactionOut | null => {
    return (
        unspentTxOuts.find(
            (tx) => tx.transactionOutId === transactionId && tx.transactionOutIndex === transactionIndex
        ) || null
    );
};

export class TransactionIn {
    transactionOutId: string;
    transactionOutIndex: number;
    signature: string;

    constructor(txOutId: string, txOutIndex: number, signature: string = "") {
        this.transactionOutId = txOutId;
        this.transactionOutIndex = txOutIndex;
        this.signature = signature;
    }

    validateTxIn = (transaction: Transaction, unspentTxOuts: UnspentTransactionOut[]): boolean => {
        const referencedUTxOut = unspentTxOuts.find(
            (uTxO) =>
                uTxO.transactionOutId === this.transactionOutId && uTxO.transactionOutIndex === this.transactionOutIndex
        );
        if (referencedUTxOut == null) {
            console.log("Referenced txOut not found: " + JSON.stringify(this));
            return false;
        }

        const key = ec.keyFromPublic(referencedUTxOut.address, "hex");
        return key.verify(transaction.id, this.signature);
    };

    getTxInAmount = (unspentTxOuts: UnspentTransactionOut[]): number => {
        const foundUTxOut = findUnspentTxOut(this.transactionOutId, this.transactionOutIndex, unspentTxOuts);
        return foundUTxOut ? foundUTxOut.amount : 0;
    };

    isValidTxInStructure(): boolean {
        if (typeof this.signature !== "string") {
            console.log("invalid signature type in txIn");
            return false;
        }
        if (typeof this.transactionOutId !== "string") {
            console.log("invalid txOutId type in txIn");
            return false;
        }
        if (typeof this.transactionOutIndex !== "number") {
            console.log("invalid txOutIndex type in txIn");
            return false;
        }
        return true;
    }
}
export class TransactionOut {
    address: string;
    amount: number;

    constructor(address: string, amount: number) {
        this.address = address;
        this.amount = amount;
    }

    isValidTxOutStructure(): boolean {
        if (typeof this.address !== "string") {
            console.log("Invalid address type in txOut");
            return false;
        }
        if (!Blockchain.isValidAddress(this.address)) {
            console.log("Invalid TxOut address");
            return false;
        }
        if (typeof this.amount !== "number" || isNaN(this.amount)) {
            console.log("Invalid amount type in txOut");
            return false;
        }
        return true;
    }
}

export class UnspentTransactionOut {
    public readonly transactionOutId: string;
    public readonly transactionOutIndex: number;
    public readonly address: string;
    public readonly amount: number;

    constructor(txOutId: string, txOutIndex: number, address: string, amount: number) {
        this.transactionOutId = txOutId;
        this.transactionOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

export class Transaction {
    id: string;
    transactionIns: TransactionIn[];
    transactionOuts: TransactionOut[];
    static readonly COINBASE_AMOUNT = 50;

    constructor(txIns: TransactionIn[], txOuts: TransactionOut[]) {
        this.transactionIns = txIns;
        this.transactionOuts = txOuts;
        this.id = this.getId();
    }

    getId(): string {
        const txInString = this.transactionIns
            .map((tx) => tx.transactionOutId + tx.transactionOutIndex)
            .reduce((prev, cur) => prev + cur, "");
        const txOutString = this.transactionOuts
            .map((tx) => tx.address + tx.amount)
            .reduce((prev, cur) => prev + cur, "");

        return SHA256(txInString + txOutString).toString();
    }

    validateTransaction(unspentTxOuts: UnspentTransactionOut[]) {
        if (this.getId() !== this.id) {
            console.log("Invalid transaction id");
            return false;
        }
        const hasValidTxIns: boolean = this.transactionIns
            .map((txIn) => txIn.validateTxIn(this, unspentTxOuts))
            .reduce((a, b) => a && b, true);

        if (!hasValidTxIns) {
            console.log("some of the txIns are invalid in tx: " + this.id);
            return false;
        }

        const totalTxInValues: number = this.transactionIns
            .map((txIn) => txIn.getTxInAmount(unspentTxOuts))
            .reduce((a, b) => a + b, 0);

        const totalTxOutValues: number = this.transactionOuts.map((txOut) => txOut.amount).reduce((a, b) => a + b, 0);

        if (totalTxOutValues !== totalTxInValues) {
            console.log("totalTxOutValues !== totalTxInValues in tx: " + this.id);
            return false;
        }

        return true;
    }

    validateCoinbaseTx(blockIndex: number): boolean {
        if (this.getId() !== this.id) {
            console.log("Invalid coinbase transaction id");
            return false;
        }

        if (this.transactionIns.length !== 1) {
            console.log("Invalid number of txIn in the coinbase transaction");
            return false;
        }

        if (this.transactionIns[0].transactionOutIndex !== blockIndex) {
            console.log("The txIn index in the coinbase tx must be the block height");
            return false;
        }

        if (this.transactionOuts.length !== 1) {
            console.log("Invalid number of txOuts in the coinbase transaction");
            return false;
        }

        if (this.transactionOuts[0].amount !== Transaction.COINBASE_AMOUNT) {
            console.log("Invalid coinbase amount in the coinbase transaction");
            return false;
        }

        return true;
    }

    static stringify(transactions: Transaction[]) {
        return JSON.stringify(
            transactions.map((tx) => ({
                id: tx.id,
                transactionIns: tx.transactionIns,
                transactionOuts: tx.transactionOuts,
            }))
        );
    }

    signTransactionIn(txInIndex: number, privateKey: string, unspentTransactionOuts: UnspentTransactionOut[]): string {
        const transactionIn: TransactionIn = this.transactionIns[txInIndex];
        const contentToSign = this.id;

        const unspentTxOutRef = findUnspentTxOut(
            transactionIn.transactionOutId,
            transactionIn.transactionOutIndex,
            unspentTransactionOuts
        );
        if (unspentTxOutRef === null) throw new Error("Could not find ref of the transaction output");

        if (getPublicKeyFromPrivateKey(privateKey) !== unspentTxOutRef.address)
            throw new Error("Cannot sign because private key does not match with public key");

        return toHexString(ec.keyFromPrivate(privateKey, "hex").sign(contentToSign).toDER());
    }

    static getCoinbaseTransaction(address: string, blockIndex: number) {
        return new Transaction(
            [new TransactionIn("", blockIndex)],
            [new TransactionOut(address, Transaction.COINBASE_AMOUNT)]
        );
    }

    static isValidTransactionsStructure = (transactions: Transaction[]): boolean => {
        return transactions.map((tx) => tx.isValidTransactionStructure()).reduce((a, b) => a && b, true);
    };

    static validateBlockTransactions(
        aTransactions: Transaction[],
        aUnspentTxOuts: UnspentTransactionOut[],
        blockIndex: number
    ): boolean {
        const coinbaseTx = aTransactions[0];
        if (!coinbaseTx.validateCoinbaseTx(blockIndex)) {
            console.log("Invalid coinbase transaction: " + JSON.stringify(coinbaseTx));
            return false;
        }

        // check for duplicate txIns. Each txIn can be included only once
        const txIns: TransactionIn[] = _(aTransactions)
            .map((tx) => tx.transactionIns)
            .flatten()
            .value();

        if (hasDuplicates(txIns)) {
            return false;
        }

        // all but coinbase transactions
        const normalTransactions: Transaction[] = aTransactions.slice(1);
        return normalTransactions.map((tx) => tx.validateTransaction(aUnspentTxOuts)).reduce((a, b) => a && b, true);
    }

    isValidTransactionStructure() {
        if (typeof this.id !== "string") {
            console.log("TransactionId is missing");
            return false;
        }
        if (!Array.isArray(this.transactionIns)) {
            console.log("Invalid txIns type in transaction");
            return false;
        }
        if (!this.transactionIns.map((txIn) => txIn.isValidTxInStructure()).reduce((a, b) => a && b, true)) {
            return false;
        }

        if (!Array.isArray(this.transactionOuts)) {
            console.log("Invalid txIns type in transaction");
            return false;
        }

        if (!this.transactionOuts.map((txOut) => txOut.isValidTxOutStructure()).reduce((a, b) => a && b, true)) {
            return false;
        }

        return true;
    }
}
