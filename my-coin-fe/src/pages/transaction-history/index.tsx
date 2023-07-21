import { useState, useEffect } from "react";
import { Button, Stack, Typography } from "@mui/material";
import PageSkeleton from "../../components/page-skeleton";
import { TxItem } from "../wallet/wallet-transaction-pool";
import API from "../../services/axios";
import Loading from "../../components/loading";
import TransactionItem from "../wallet/components/transaction-item";
import { useKeyContext } from "../../context/key-context";
import { getPublicKeyFromPrivateKey } from "../../utils/keygen";
import { useNavigate } from "react-router-dom";

export type TransactionStatus = "pending" | "done";

interface IListItem extends TxItem {
    status?: TransactionStatus;
    extra?: { from: string; to: string; amount: number };
}

export default function TransactionHistory() {
    const navigate = useNavigate();
    const { publicKey, privateKey, changePublicKey } = useKeyContext();
    const [txList, setTxList] = useState<IListItem[]>([]);
    const [refresh, setRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (privateKey === "") {
            alert("Invalid wallet info");
            navigate("/my-wallet");
            return;
        }

        let inferredPublicKey = publicKey;
        if (publicKey === "") {
            inferredPublicKey = getPublicKeyFromPrivateKey(privateKey);
            changePublicKey(inferredPublicKey);
        }

        const fetchTx = async (address: string) => {
            setIsLoading(true);
            try {
                const res = await API.get<any, { pending: TxItem[]; done: TxItem[] }>(
                    `/blockchain/transaction/${address}`
                );

                setTxList(
                    res.pending
                        .map((tx) => ({ ...tx, status: "pending" } as IListItem))
                        .concat(res.done.map((tx) => ({ ...tx, status: "done" } as IListItem)))
                        .map((item) => {
                            const receiver = item.transactionOuts.find((txOut) => txOut.address !== address);
                            return {
                                ...item,
                                extra: {
                                    from: address,
                                    to: receiver?.address || "N/A",
                                    amount: receiver?.amount || "-1",
                                },
                            } as IListItem;
                        })
                );
            } catch (err) {
                console.log(err);
                alert("There was an error while fetching transaction data");
            }
            setIsLoading(false);
        };

        fetchTx(inferredPublicKey);
    }, [refresh, publicKey, privateKey, changePublicKey]);
    return (
        <PageSkeleton title="My Transaction History">
            <Stack gap={3}>
                <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "center" }}
                    flexWrap="wrap"
                    gap={3}
                >
                    <Stack direction="row" gap={2}>
                        <Button variant="contained" size="large" onClick={() => navigate("/my-wallet")}>
                            Back To My Wallet
                        </Button>
                    </Stack>

                    <Stack direction="row" sx={{ justifyContent: "flex-end" }} gap={2}>
                        <Button variant="contained" size="large" onClick={() => setRefresh((prev) => !prev)}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>
                {isLoading ? (
                    <Loading />
                ) : txList.length === 0 ? (
                    <Typography variant="body1">You do not have any transaction</Typography>
                ) : (
                    txList.map((tx) => <TransactionItem {...tx} key={tx.id} />)
                )}
            </Stack>
        </PageSkeleton>
    );
}
