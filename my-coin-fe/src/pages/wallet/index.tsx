import { useState, useEffect, useRef } from "react";
import PageSkeleton from "../../components/page-skeleton";
import { TextField, Button, Stack, Alert, Divider, Typography } from "@mui/material";
import { getPublicKeyFromPrivateKey } from "../../utils/keygen";
import Loading from "../../components/loading";
import API from "../../services/axios";
import WalletInfo from "./wallet-info";
import WalletTransaction from "./wallet-transaction";
import { useNavigate } from "react-router-dom";

export default function Wallet() {
    const [myPrivateKey, setMyPrivateKey] = useState<string>("");
    const [myPublicKey, setMyPublicKey] = useState<string>("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [myBalance, setMyBalance] = useState<number | undefined>();

    const inputRef = useRef<HTMLInputElement | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (myPrivateKey === "") return;

        const publicKey = getPublicKeyFromPrivateKey(myPrivateKey);
        setMyPublicKey(publicKey);

        const fetchWalletInfo = async () => {
            setIsLoading(true);
            try {
                const resp: any = await API.get(`/blockchain/balance/${publicKey}`);
                setMyBalance(resp.balance);
            } catch (err) {
                console.log(err);
            }
            setIsLoading(false);
        };

        fetchWalletInfo();
    }, [myPrivateKey, isLoading]);

    const handleSubmitPrivateKey: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const inputPrivateKey = ((e.target as any)["private-key"].value as string).trim();

        if (inputPrivateKey === "") {
            setError("Please input a valid private key");
            return;
        }

        setMyPrivateKey(inputPrivateKey);
    };

    const handleLoadKey: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files === null) return;

        if (e.target.files.length === 0) return;

        const targetFile = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            if (event.target === null) return;
            setMyPrivateKey(event.target.result as string);
        };

        reader.readAsText(targetFile);
    };

    const changeWallet = () => {
        setMyPrivateKey("");
        setMyPublicKey("");
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
                            <WalletInfo balance={myBalance} publicAddress={myPublicKey} changeWallet={changeWallet} />

                            <Divider flexItem />

                            <WalletTransaction />
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
