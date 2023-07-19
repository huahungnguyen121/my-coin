import "dotenv/config";
import bodyParser from "body-parser";
import express, { Router } from "express";
import helmet from "helmet";
import cors from "cors";
import { Server, WebSocket } from "ws";
import { APP_CONSTANTS } from "./constants/app-constants";
import { Block, Blockchain } from "./blockchain/blockchain";
import { MESSAGE_TYPE, SOCKET_EVENT_NAME, TMessage } from "./constants/common-constants";
import { buildMsg, parseJSON } from "./utils";
import { indexOf } from "lodash";
import { initWallet } from "./wallet";
import { Transaction, TransactionIn, TransactionOut } from "./blockchain/transaction";

const httpPort: number = APP_CONSTANTS.HTTP_PORT;
const socketPort: number = APP_CONSTANTS.SOCKET_PORT;

const blockchain = new Blockchain();
const sockets: WebSocket[] = [];

// helpers
export const send = (ws: WebSocket, msg: TMessage) => ws.send(JSON.stringify(msg));
export const broadcast = (msg: TMessage) => {
    sockets.forEach((socket) => send(socket, msg));
};

const initHandlers = (socket: WebSocket) => {
    // store the new peer
    sockets.push(socket);

    // init handlers
    socket.on(SOCKET_EVENT_NAME.RECEIVED_MSG, (received: string) => {
        const data = parseJSON<TMessage>(received);

        if (data === null) {
            console.log("Invalid message");
            return;
        }

        let msgType: number = -1;

        try {
            msgType = parseInt(data.type.toString());
        } catch (err) {}

        switch (msgType) {
            case MESSAGE_TYPE.GET_LASTEST_BLOCK: {
                const chain = blockchain.getChain();
                const msg = buildMsg(MESSAGE_TYPE.RECEIVE_CHAIN, [chain[chain.length - 1]]);
                send(socket, msg);
                return;
            }

            case MESSAGE_TYPE.GET_ENTIRE_CHAIN: {
                const chain = blockchain.getChain();
                const msg = buildMsg(MESSAGE_TYPE.RECEIVE_CHAIN, chain);
                send(socket, msg);
                return;
            }

            case MESSAGE_TYPE.RECEIVE_CHAIN: {
                const receivedChain = parseJSON<Block[]>(data.data);

                if (receivedChain === null) {
                    console.log("Received an invalid chain");
                    console.log("Received data: ", data.data);
                    return;
                }

                if (receivedChain.length === 0) {
                    console.log("Received an empty chain");
                    return;
                }

                const latestReceivedBlock = receivedChain[receivedChain.length - 1];
                const currentChain = blockchain.getChain();

                if (latestReceivedBlock.index > currentChain[currentChain.length - 1].index) {
                    console.log(
                        `Received last block with index: ${
                            latestReceivedBlock.index
                        } and current last block has index: ${currentChain[currentChain.length - 1].index}`
                    );
                    if (latestReceivedBlock.prevHash === currentChain[currentChain.length - 1].hash) {
                        if (!Array.isArray(latestReceivedBlock.transaction)) {
                            console.log("Content of the received block is not valid");
                            return;
                        }
                        console.log("Received block is the next block, add block to the chain");
                        blockchain.addBlock(
                            new Block(
                                latestReceivedBlock.index,
                                latestReceivedBlock.transaction.map(
                                    (tx) =>
                                        new Transaction(
                                            tx.transactionIns.map(
                                                (txIn) =>
                                                    new TransactionIn(
                                                        txIn.transactionOutId,
                                                        txIn.transactionOutIndex,
                                                        txIn.signature
                                                    )
                                            ),
                                            tx.transactionOuts.map(
                                                (txOut) => new TransactionOut(txOut.address, txOut.amount)
                                            )
                                        )
                                ),
                                latestReceivedBlock.difficulty,
                                latestReceivedBlock.nonce,
                                latestReceivedBlock.hash,
                                latestReceivedBlock.prevHash,
                                latestReceivedBlock.timestamp?.toString()
                            )
                        );
                        return;
                    }

                    if (receivedChain.length === 1) {
                        console.log("Received block is not the next block, get chain from peer");
                        broadcast(buildMsg(MESSAGE_TYPE.GET_ENTIRE_CHAIN));
                        return;
                    }

                    console.log("Received a new chain, handle and modify current chain");
                    const replaceStatus = blockchain.replaceChain(receivedChain);
                    console.log(
                        replaceStatus ? "Replace with the new chain successfully" : "Cannot replace with the new chain"
                    );
                }

                return;
            }

            case MESSAGE_TYPE.GET_TRANSACTION_POOL: {
                send(socket, buildMsg(MESSAGE_TYPE.RECEIVE_TRANSACTION_POOL, blockchain.getTxPoolData()));
                return;
            }

            case MESSAGE_TYPE.RECEIVE_TRANSACTION_POOL: {
                const receivedTransactions = parseJSON<Transaction[]>(data.data);
                if (receivedTransactions === null || !Array.isArray(receivedTransactions)) {
                    console.log("Invalid transaction received: ", JSON.stringify(data.data));
                    break;
                }

                receivedTransactions.forEach((transaction: Transaction) => {
                    try {
                        const temp = new Transaction(transaction.transactionIns, transaction.transactionOuts);
                        blockchain.addToTxPool(temp);
                        broadcast(buildMsg(MESSAGE_TYPE.RECEIVE_TRANSACTION_POOL, blockchain.getTxPoolData()));
                    } catch (e: any) {
                        console.log(e?.message);
                    }
                });

                return;
            }

            default: {
                console.log("Invalid message type");
                return;
            }
        }
    });
};

const initClosingHandlers = (ws: WebSocket) => {
    const closeConnection = (s: WebSocket) => {
        console.log(`Fail to connect to ${s.url}`);
        sockets.splice(indexOf(sockets, s));
    };

    ws.on("close", () => closeConnection(ws));
    ws.on("error", () => closeConnection(ws));
};

const connectToPeers = (newPeer: string): void => {
    const ws: WebSocket = new WebSocket(newPeer);
    ws.on("open", () => {
        initHandlers(ws);
        initClosingHandlers(ws);
    });
    ws.on("error", () => {
        console.log("Connection failed");
    });
};

const initBlockchainRouter = (): Router => {
    const blockchainRouter = express.Router();

    // get current blockchain
    blockchainRouter.get("/", (req, res) => {
        res.send(blockchain.getChain());
    });

    // mine a block
    blockchainRouter.post("/mine-block", (req, res) => {
        const newBlock = blockchain.generateNextBlock();
        if (newBlock === null) {
            return res.status(400).send("Failed to generate block");
        }

        res.send(newBlock);
    });

    // mine a transaction
    blockchainRouter.post("/mine-transaction", (req, res) => {
        let { address, amount } = req.body;

        if (!address || !amount) return res.status(400).send();

        const parsedAmount = parseInt(amount);

        if (address === "" || isNaN(parsedAmount)) return res.status(400).send();

        try {
            const block = blockchain.generateNextBlockWithTransaction(address, parsedAmount);
            if (block === null) return res.status(400).send("Failed to create a new block from transaction");

            res.send(block);
        } catch (error: any) {
            console.log(error?.message);
            res.status(400).send({ msg: error?.message });
        }
    });

    blockchainRouter.post("/transaction", (req, res) => {
        try {
            const { address, amount } = req.body;

            if (!address || !amount) {
                console.log("Invalid address or amount");
                return res.status(400).send();
            }

            const parsedAmount = parseInt(amount);

            if (address === "" || isNaN(parsedAmount)) {
                console.log("Invalid address or amount");
                return res.status(400).send();
            }

            const tx: Transaction = blockchain.sendTransaction(address, parsedAmount);
            broadcast(buildMsg(MESSAGE_TYPE.RECEIVE_TRANSACTION_POOL, blockchain.getTxPoolData()));

            res.send(tx);
        } catch (e: any) {
            console.log(e?.message);
            res.status(400).send({ msg: e?.message });
        }
    });

    blockchainRouter.get("/balance", (req, res) => {
        const balance = blockchain.getAccountBalance();
        res.send({ balance: balance });
    });

    return blockchainRouter;
};

const initP2pRouter = (): Router => {
    const p2pRouter = express.Router();

    p2pRouter.get("/", (req, res) => {
        res.send(sockets.map((s: any) => s._socket.remoteAddress + ":" + s._socket.remotePort));
    });

    p2pRouter.post("/connect", (req, res) => {
        const { peer } = req.body;

        if (!peer || peer === "") return res.status(400).send();

        connectToPeers(peer);

        res.status(201).send();
    });

    return p2pRouter;
};

const initHttpServer = (myHttpPort: number) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(helmet());
    app.use(
        cors({
            origin: APP_CONSTANTS.ALLOW_ORIGINS,
        })
    );

    // root
    app.get("/", (req, res) => {
        res.send("Welcome to MyCoin");
    });

    // init routers
    app.use("/blockchain", initBlockchainRouter());

    app.use("/p2p", initP2pRouter());

    app.listen(myHttpPort, () => {
        console.log("HTTP is listening on port: " + myHttpPort);
    });
};

const initSocketServer = (port: number) => {
    const server = new Server({ port: port });

    server.on("connection", (socket) => {
        console.log("==================================");
        console.log(
            "New Connection: ",
            (socket as any)._socket.remoteAddress + ":" + (socket as any)._socket.remotePort
        );
        console.log("==================================");

        initHandlers(socket);
        initClosingHandlers(socket);
    });

    console.log(`P2P is listening on port: ${port.toString()}`);
};

initHttpServer(httpPort);
initSocketServer(socketPort);
initWallet();
