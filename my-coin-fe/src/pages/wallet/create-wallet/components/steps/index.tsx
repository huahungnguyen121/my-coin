import { Box, Button, Card, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import {
    AttachMoneyRounded,
    NearMeDisabledRounded,
    FileCopyRounded,
    DoneRounded,
    CheckCircleRounded,
} from "@mui/icons-material";
import React, { useState } from "react";
import { saveAs } from "file-saver";
import { ec } from "../../../../../utils/keygen";
import { useNavigate } from "react-router-dom";

function BaseStep(props: { title?: string; children?: React.ReactNode }) {
    const { title, children } = props;

    return (
        <Stack gap={3}>
            {title !== undefined && (
                <Typography sx={{ fontWeight: "bold" }} variant="h5">
                    {title}
                </Typography>
            )}

            {children}
        </Stack>
    );
}

interface StepProps {
    goBack: () => void;
    toNextStep: () => void;
}

type KeyType = "public-key" | "private-key";

export function Step1(props: StepProps) {
    const { toNextStep } = props;
    const [keyPair, setKeyPair] = useState<{ privateKey: string; publicKey: string } | null>(null);
    const [copyStatus, setCopyStatus] = useState<{ privateKey: boolean; publicKey: boolean }>({
        privateKey: false,
        publicKey: false,
    });

    const genKeyPair = () => {
        const key = ec.genKeyPair();
        setKeyPair({
            privateKey: key.getPrivate("hex"),
            publicKey: key.getPublic("hex"),
        });
    };

    const handleCopyKey = (type: KeyType) => {
        if (keyPair === null) return;

        if (type === "public-key") {
            navigator.clipboard.writeText(keyPair.publicKey);
            setCopyStatus((prev) => ({ ...prev, publicKey: true }));
            setTimeout(() => setCopyStatus((prev) => ({ ...prev, publicKey: false })), 5000);
            return;
        }

        if (type === "private-key") {
            navigator.clipboard.writeText(keyPair.privateKey);
            setCopyStatus((prev) => ({ ...prev, privateKey: true }));
            setTimeout(() => setCopyStatus((prev) => ({ ...prev, privateKey: false })), 5000);
            return;
        }
    };

    const handleSaveKeyToFile = (type: KeyType) => {
        if (keyPair === null) return;

        if (type === "public-key") {
            let blob = new Blob([keyPair.publicKey], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "public_key");
            return;
        }

        if (type === "private-key") {
            let blob = new Blob([keyPair.privateKey], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "private_key");
            return;
        }
    };

    return (
        <BaseStep title="Step 1">
            <Stack gap={3}>
                <Typography variant="body1">Important things to know before getting your key:</Typography>

                <Grid container spacing={3}>
                    <Grid item lg={4} md={6} xs={12}>
                        <Card
                            sx={{
                                minHeight: "250px",
                                padding: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            variant="outlined"
                        >
                            <Stack gap={1} sx={{ width: "100%" }}>
                                <NearMeDisabledRounded
                                    sx={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}
                                    color="primary"
                                />

                                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                                    Don't lose it
                                </Typography>
                                <Typography variant="body1">
                                    Be careful, it can not be recovered if you lose it
                                </Typography>
                            </Stack>
                        </Card>
                    </Grid>
                    <Grid item lg={4} md={6} xs={12}>
                        <Card
                            sx={{
                                minHeight: "250px",
                                padding: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            variant="outlined"
                        >
                            <Stack gap={1} sx={{ width: "100%" }}>
                                <AttachMoneyRounded
                                    sx={{ fontSize: "3.5rem", marginBottom: "1.2rem" }}
                                    color="primary"
                                />

                                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                                    Don't share it
                                </Typography>
                                <Typography variant="body1">
                                    Your funds will be stolen if you use this file on a malicious phishing site.
                                </Typography>
                            </Stack>
                        </Card>
                    </Grid>
                    <Grid item lg={4} md={6} xs={12}>
                        <Card
                            sx={{
                                minHeight: "250px",
                                padding: "1rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            variant="outlined"
                        >
                            <Stack gap={1} sx={{ width: "100%" }}>
                                <FileCopyRounded sx={{ fontSize: "3.5rem", marginBottom: "1.2rem" }} color="primary" />

                                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                                    Make a backup
                                </Typography>
                                <Typography variant="body1">
                                    Secure it like the millions of dollars it may one day be worth.
                                </Typography>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>

                {keyPair === null ? (
                    <Button variant="contained" size="large" onClick={() => genKeyPair()}>
                        Acknowledge and get key
                    </Button>
                ) : (
                    <>
                        <Divider flexItem />

                        <Typography sx={{ fontWeight: "bold" }} variant="h5">
                            Your public key:
                        </Typography>

                        <Typography variant="subtitle2">
                            This is your public key as well as your public address of your wallet.
                        </Typography>

                        <Stack gap={2}>
                            <TextField
                                InputProps={{ readOnly: true }}
                                sx={{ flexGrow: "1" }}
                                value={keyPair.publicKey}
                            />
                            <Stack direction="row" gap={1} sx={{ justifyContent: "flex-end" }}>
                                <Button variant="contained" onClick={() => handleCopyKey("public-key")} size="large">
                                    {copyStatus.publicKey ? <DoneRounded /> : "Copy"}
                                </Button>

                                <Divider orientation="vertical" flexItem />

                                <Button
                                    variant="contained"
                                    onClick={() => handleSaveKeyToFile("public-key")}
                                    size="large"
                                >
                                    Download as a file
                                </Button>
                            </Stack>
                        </Stack>

                        <Typography sx={{ fontWeight: "bold" }} variant="h5">
                            Your private key:
                        </Typography>

                        <Typography variant="subtitle2" color="red">
                            This is your private key of your wallet and it is EXTREMELY IMPORTANT. Please KEEP IT SAFE
                            and DO NOT SHARE IT WITH ANYONE because anyone has this key can have full access to your
                            wallet.
                        </Typography>

                        <Stack gap={1}>
                            <TextField
                                InputProps={{ readOnly: true }}
                                sx={{ flexGrow: "1" }}
                                value={keyPair.privateKey}
                            />

                            <Stack direction="row" gap={1} sx={{ justifyContent: "flex-end" }}>
                                <Button variant="contained" onClick={() => handleCopyKey("private-key")} size="large">
                                    {copyStatus.privateKey ? <DoneRounded /> : "Copy"}
                                </Button>

                                <Divider orientation="vertical" flexItem />

                                <Button
                                    variant="contained"
                                    onClick={() => handleSaveKeyToFile("private-key")}
                                    size="large"
                                >
                                    Download as a file
                                </Button>
                            </Stack>
                        </Stack>

                        <Divider flexItem />

                        <Stack direction="row" gap={1} sx={{ justifyContent: "flex-end" }}>
                            <Button variant="contained" onClick={() => toNextStep && toNextStep()} size="large">
                                Next Step
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </BaseStep>
    );
}

export function Step2(props: StepProps) {
    const { goBack } = props;
    const navigate = useNavigate();

    return (
        <BaseStep title="Step 2">
            <Grid container spacing={3}>
                <Grid item md={6} xs={12}>
                    <Stack gap={3}>
                        <Stack direction="row" gap={1}>
                            <Typography sx={{ fontWeight: "bold" }} variant="h5">
                                You are done!
                            </Typography>

                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <CheckCircleRounded color="success" />
                            </Box>
                        </Stack>

                        <Typography variant="body1">
                            You are now ready to use your wallet with your key! Have fun with what MyCoin has to offer!
                        </Typography>
                    </Stack>
                </Grid>
                <Grid item md={6} xs={12}>
                    <Stack gap={3}>
                        <Button variant="contained" size="large" onClick={() => navigate("/my-wallet")}>
                            Access my wallet
                        </Button>

                        <Divider flexItem />
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => (goBack ? goBack() : navigate("/create-wallet"))}
                        >
                            Create another wallet
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </BaseStep>
    );
}
