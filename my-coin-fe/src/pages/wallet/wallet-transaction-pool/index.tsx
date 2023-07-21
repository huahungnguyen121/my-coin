import { useState, useEffect } from "react";
import { Button, Stack, Typography } from "@mui/material";
import API from "../../../services/axios";
import TransactionItem from "../components/transaction-item";
import Loading from "../../../components/loading";
import { useNavigate } from "react-router-dom";

export interface TxItem {
    transactionIns: {
        transactionOutId: string;
        transactionOutIndex: number;
        signature: string;
    }[];
    transactionOuts: {
        address: string;
        amount: number;
    }[];
    id: string;
}

type TxPoolResp = TxItem[];

export default function WalletTransactionPool() {
    const navigate = useNavigate();

    const [txPool, setTxPool] = useState<TxPoolResp>([]);
    const [poolRefresh, setPoolRefresh] = useState(false);
    const [isPoolLoading, setIsPoolLoading] = useState(false);

    useEffect(() => {
        const fetchTxPool = async () => {
            setIsPoolLoading(true);
            try {
                const res = await API.get<any, TxPoolResp>(`/blockchain/transaction`);

                setTxPool(res);
            } catch (err) {
                console.log(err);
                alert("There was an error while fetching transaction pool data");
            }
            setIsPoolLoading(false);
        };

        fetchTxPool();
    }, [poolRefresh]);

    return (
        <Stack gap={3}>
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center" }}
                flexWrap="wrap"
                gap={3}
            >
                <Typography sx={{ fontWeight: "bold" }} variant="h5">
                    Transaction Pool:
                </Typography>

                <Stack direction="row" sx={{ justifyContent: "flex-end" }} gap={2}>
                    <Button variant="contained" size="large" onClick={() => navigate("/my-transaction")}>
                        My Transaction
                    </Button>
                    <Button variant="contained" size="large" onClick={() => setPoolRefresh((prev) => !prev)}>
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            {isPoolLoading ? (
                <Loading />
            ) : txPool.length === 0 ? (
                <Typography variant="body1">There is no transaction currently in the transaction pool</Typography>
            ) : (
                txPool.map((tx) => <TransactionItem {...tx} key={tx.id} />)
            )}
        </Stack>
    );
}
