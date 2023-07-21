import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import API from "../../../services/axios";

interface WalletTransactionProps {
    privateKey: string;
    refresh?: () => void;
}

type StatusType = "error" | "success" | null;

const defaultStatus = { type: null, msg: "" };

export default function WalletTransaction(props: WalletTransactionProps) {
    const { privateKey, refresh } = props;
    const [status, setStatus] = useState<{ type: StatusType; msg: string }>(defaultStatus);

    const handleAPI = async (form: { address: string; amount: number }, senderPrivateKey: string) => {
        try {
            await API.post(`/blockchain/${senderPrivateKey}/send-transaction`, form);

            refresh && refresh();
            setStatus({ type: "success", msg: "Created transaction successfully" });

            return Promise.resolve();
        } catch (err) {
            console.log(err);
            const resp = (err as any)?.response;

            if (resp?.status === 400) {
                const msg = resp?.data?.msg;
                if (msg && msg !== "") setStatus({ type: "error", msg: msg });
                return Promise.reject();
            }

            setStatus({ type: "error", msg: "There was an error occurred" });
            return Promise.reject();
        }
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const inputReceiverAddress = ((e.target as any)["receiver-address"].value as string).trim();
        const inputAmount = ((e.target as any)["amount"].value as string).trim();

        const parsedInputAmount = parseInt(inputAmount);

        if (isNaN(parsedInputAmount)) {
            setStatus({ type: "error", msg: "Amount must be a number" });
            return;
        }

        if (parsedInputAmount <= 0) {
            setStatus({ type: "error", msg: "Amount must be greater than 0" });
            return;
        }

        if (inputReceiverAddress === "") {
            setStatus({ type: "error", msg: "Please input a valid address" });
            return;
        }

        handleAPI({ address: inputReceiverAddress, amount: parsedInputAmount }, privateKey)
            .then(() => {
                (e.target as any).reset();
            })
            .catch(() => {});
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap={3}>
                <Typography sx={{ fontWeight: "bold" }} variant="h5">
                    Send coin:
                </Typography>

                {status.type !== null && (
                    <Alert severity={status.type} onClose={() => setStatus(defaultStatus)}>
                        {status.msg}
                    </Alert>
                )}

                <TextField
                    id="receiver-address"
                    name="receiver-address"
                    label="Address of the receiver"
                    variant="outlined"
                    autoComplete="off"
                    required
                />

                <TextField
                    id="amount"
                    name="amount"
                    label="Amount to send"
                    variant="outlined"
                    autoComplete="off"
                    required
                />

                <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                    <Button type="submit" variant="contained" size="large">
                        Send
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
