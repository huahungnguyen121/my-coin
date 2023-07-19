import _ from "lodash";
import { Transaction, TransactionIn, UnspentTransactionOut } from "./transaction";
import { hasTxIn } from "../utils";

export class TransactionPool {
    private pool: Transaction[] = [];

    getPool() {
        return _.cloneDeep(this.pool);
    }

    addToTransactionPool(tx: Transaction, unspentTxOuts: UnspentTransactionOut[]) {
        if (!tx.validateTransaction(unspentTxOuts)) {
            throw Error("Trying to add an invalid transaction to pool");
        }

        if (!tx.isValidTxForPool(this)) {
            throw Error("Trying to add invalid tx to pool");
        }

        console.log("Add the following tx to txPool: ", JSON.stringify(tx));
        this.pool.push(tx);
    }

    getTxPoolIns(): TransactionIn[] {
        return _(this.pool)
            .map((tx) => tx.transactionIns)
            .flatten()
            .value();
    }

    updateTransactionPool(unspentTxOuts: UnspentTransactionOut[]) {
        const invalidTxs = [];

        for (const tx of this.pool) {
            for (const txIn of tx.transactionIns) {
                if (!hasTxIn(txIn, unspentTxOuts)) {
                    invalidTxs.push(tx);
                    break;
                }
            }
        }

        if (invalidTxs.length > 0) {
            console.log("Remove the following transactions from txPool: ", JSON.stringify(invalidTxs));
            this.pool = _.without(this.pool, ...invalidTxs);
        }
    }

    filterTxPoolTxs(unspentTxOuts: UnspentTransactionOut[]): UnspentTransactionOut[] {
        const txIns: TransactionIn[] = _(this.pool)
            .map((tx: Transaction) => tx.transactionIns)
            .flatten()
            .value();
        const removable: UnspentTransactionOut[] = [];
        for (const unspentTxOut of unspentTxOuts) {
            const txIn = _.find(
                txIns,
                (aTxIn: TransactionIn) =>
                    aTxIn.transactionOutIndex === unspentTxOut.transactionOutIndex &&
                    aTxIn.transactionOutId === unspentTxOut.transactionOutId
            );

            if (txIn !== undefined) removable.push(unspentTxOut);
        }

        return _.without(unspentTxOuts, ...removable);
    }
}
