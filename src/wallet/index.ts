import { existsSync, readFileSync, writeFileSync } from "fs";
import _ from "lodash";
import { Transaction, TransactionIn, TransactionOut, UnspentTransactionOut } from "../blockchain/transaction";
import { ec as EC, getPublicKeyFromPrivateKey } from "../keygen";
import { TransactionPool } from "../blockchain/transaction-pool";

const privateKeyLocation = "files/wallet/private_key.txt";
const publicKeyLocation = "files/wallet/public_key.txt";

const getPrivateFromWallet = (): string => {
    const buffer = readFileSync(privateKeyLocation, "utf8");
    return buffer.toString();
};

const getPublicFromWallet = (): string => {
    const privateKey = getPrivateFromWallet();
    const key = EC.keyFromPrivate(privateKey, "hex");
    return key.getPublic("hex");
};

const generatePrivateKey = (): string => {
    const keyPair = EC.genKeyPair();
    return keyPair.getPrivate("hex");
};

const initWallet = () => {
    // Prevent overriding existing private keys
    if (existsSync(privateKeyLocation)) {
        if (existsSync(publicKeyLocation)) {
            return;
        }
        writeFileSync(publicKeyLocation, getPublicKeyFromPrivateKey(getPrivateFromWallet()));
        return;
    }
    const newPrivateKey = generatePrivateKey();

    writeFileSync(privateKeyLocation, newPrivateKey);
    writeFileSync(publicKeyLocation, getPublicKeyFromPrivateKey(newPrivateKey));
    console.log("Created a new wallet with provided private key");
};

const getBalance = (address: string, unspentTxOuts: UnspentTransactionOut[]): number => {
    return _(unspentTxOuts)
        .filter((uTxO: UnspentTransactionOut) => uTxO.address === address)
        .map((uTxO: UnspentTransactionOut) => uTxO.amount)
        .sum();
};

const findTxOutsForAmount = (amount: number, myUnspentTxOuts: UnspentTransactionOut[]) => {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        currentAmount = currentAmount + myUnspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return { includedUnspentTxOuts, leftOverAmount };
        }
    }
    throw Error("Not enough coins to make transaction");
};

const createTxOuts = (receiverAddress: string, myAddress: string, amount: number, leftOverAmount: number) => {
    const txOut1: TransactionOut = new TransactionOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
        return [txOut1];
    }

    const leftOverTx = new TransactionOut(myAddress, leftOverAmount);
    return [txOut1, leftOverTx];
};

const createTransaction = (
    receiverAddress: string,
    amount: number,
    privateKey: string,
    unspentTxOuts: UnspentTransactionOut[],
    txPool: TransactionPool
): Transaction => {
    console.log("txPool: ", JSON.stringify(txPool));
    const myAddress: string = getPublicKeyFromPrivateKey(privateKey);
    const myUnspentTxOutsFromUnspentTxOuts = unspentTxOuts.filter(
        (uTxO: UnspentTransactionOut) => uTxO.address === myAddress
    );

    const myUnspentTxOuts = txPool.filterTxPoolTxs(myUnspentTxOutsFromUnspentTxOuts);

    const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);

    const unsignedTxIns: TransactionIn[] = includedUnspentTxOuts.map(
        (unspentTxOut: UnspentTransactionOut) =>
            new TransactionIn(unspentTxOut.transactionOutId, unspentTxOut.transactionOutIndex)
    );

    const tx: Transaction = new Transaction(
        unsignedTxIns,
        createTxOuts(receiverAddress, myAddress, amount, leftOverAmount)
    );

    // sign all txIns
    tx.transactionIns = tx.transactionIns.map((txIn: TransactionIn, index: number) => {
        txIn.signature = tx.signTransactionIn(index, privateKey, unspentTxOuts);
        return txIn;
    });

    return tx;
};

export {
    createTransaction,
    getPublicFromWallet,
    getPrivateFromWallet,
    getBalance,
    generatePrivateKey,
    initWallet,
    findTxOutsForAmount,
};
