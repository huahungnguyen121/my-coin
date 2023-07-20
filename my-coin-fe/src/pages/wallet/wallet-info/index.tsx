import { Button, Stack, Typography } from "@mui/material";

interface WalletInfoProps {
    balance?: number;
    publicAddress?: string;
    changeWallet?: () => void;
}

export default function WalletInfo(props: WalletInfoProps) {
    const { balance, publicAddress, changeWallet } = props;
    return (
        <Stack gap={3}>
            <Typography sx={{ fontWeight: "bold" }} variant="h5">
                Your public address:
            </Typography>

            {publicAddress !== undefined ? (
                <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                    {publicAddress}
                </Typography>
            ) : (
                "N/A"
            )}

            <Typography sx={{ fontWeight: "bold" }} variant="h5">
                Your balance:
            </Typography>

            {balance !== undefined ? <Typography variant="body1">{balance} MYCOIN(s)</Typography> : "N/A"}

            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                <Button variant="contained" size="large" onClick={() => changeWallet && changeWallet()}>
                    Change Wallet
                </Button>
            </Stack>
        </Stack>
    );
}
