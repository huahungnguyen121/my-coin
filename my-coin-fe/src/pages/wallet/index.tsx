import { useState, useEffect, useRef } from "react";
import PageSkeleton from "../../components/page-skeleton";
import { TextField, Button, Stack, Alert, Divider, Typography } from "@mui/material";
import { getPublicKeyFromPrivateKey } from "../../utils/keygen";
import Loading from "../../components/loading";
import API from "../../services/axios";
import WalletInfo from "./wallet-info";
import WalletTransaction from "./wallet-transaction";
import { useNavigate } from "react-router-dom";
import { useKeyContext } from "../../context/key-context";
import WalletTransactionPool from "./wallet-transaction-pool";

export default function Wallet() {
    const { publicKey, privateKey, changePrivateKey, changePublicKey } = useKeyContext();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [myBalance, setMyBalance] = useState<number | undefined>();
    const [refresh, setRefresh] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (privateKey === "") return;

        let inferredPublicKey = publicKey;
        if (publicKey === "") {
            inferredPublicKey = getPublicKeyFromPrivateKey(privateKey);
            changePublicKey(inferredPublicKey);
        }

        const fetchWalletInfo = async () => {
            setIsLoading(true);
            try {
                const resp = await API.get<any, { balance: number }>(`/blockchain/balance/${inferredPublicKey}`);
                setMyBalance(resp.balance);
            } catch (err) {
                console.log(err);
            }
            setIsLoading(false);
        };

        fetchWalletInfo();
    }, [privateKey, publicKey, refresh, changePublicKey]);

    const handleSubmitPrivateKey: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const inputPrivateKey = ((e.target as any)["private-key"].value as string).trim();

        if (inputPrivateKey === "") {
            setError("Please input a valid private key");
            return;
        }

        changePrivateKey(inputPrivateKey);
        setError("");
        (e.target as any).reset();
    };

    const handleLoadKey: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files === null) return;

        if (e.target.files.length === 0) return;

        const targetFile = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target === null) return;
            changePrivateKey(event.target.result as string);
        };

        reader.readAsText(targetFile);
    };

    const changeWallet = () => {
        changePrivateKey("");
        changePublicKey("");
        setMyBalance(undefined);
    };

    return (
        <PageSkeleton title="My Wallet">
            {isLoading ? (
                <Loading />
            ) : (
                <>
                    {myBalance !== undefined ? (
                        <Stack gap={3}>
                            <WalletInfo
                                balance={myBalance}
                                publicAddress={publicKey}
                                changeWallet={changeWallet}
                                refresh={() => setRefresh((prev) => !prev)}
                            />

                            <Divider flexItem />

                            <WalletTransaction privateKey={privateKey} />

                            <Divider flexItem />

                            <WalletTransactionPool />
                        </Stack>
                    ) : (
                        <Stack gap={3}>
                            <form onSubmit={handleSubmitPrivateKey}>
                                <Stack gap={3}>
                                    {error !== "" && (
                                        <Alert severity="error" onClose={() => setError("")}>
                                            {error}
                                        </Alert>
                                    )}

                                    <TextField
                                        id="private-key"
                                        name="private-key"
                                        label="Your private key"
                                        variant="outlined"
                                        autoComplete="off"
                                        required
                                    />

                                    <Button type="submit" variant="contained" size="large">
                                        Access My Wallet
                                    </Button>
                                </Stack>
                            </form>

                            <Divider flexItem>OR</Divider>

                            <Typography variant="body1">
                                Please choose the file containing your private key that you have saved when creating
                                your wallet.
                            </Typography>

                            <input
                                style={{ display: "none" }}
                                ref={inputRef}
                                type="file"
                                accept=".txt"
                                onChange={handleLoadKey}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => {
                                    if (inputRef.current === null) return;
                                    inputRef.current.click();
                                }}
                            >
                                Load private key from file
                            </Button>

                            <Divider flexItem />

                            <Typography variant="body1">
                                If you do not have a wallet, you can create a new wallet for your own.{" "}
                            </Typography>

                            <Button variant="outlined" size="large" onClick={() => navigate("/create-wallet")}>
                                Create A New Wallet
                            </Button>
                        </Stack>
                    )}
                </>
            )}
        </PageSkeleton>
    );
}
