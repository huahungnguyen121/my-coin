import { Fragment } from "react";
import { Box, Card, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { TxItem } from "../../wallet-transaction-pool";
import { TransactionStatus } from "../../../transaction-history";

export default function TransactionItem(
    props: TxItem & { status?: TransactionStatus; extra?: { from: string; to: string; amount: number } }
) {
    const { id, transactionIns, transactionOuts, status, extra } = props;

    let chipLabel: {
        type: "success" | "warning" | undefined;
        label: string;
    } = {
        type: undefined,
        label: "",
    };

    switch (status) {
        case "done": {
            chipLabel = {
                type: "success",
                label: "Included in the blockchain",
            };
            break;
        }
        case "pending": {
            chipLabel = {
                type: "warning",
                label: "Pending",
            };
            break;
        }
    }

    return (
        <Card sx={{ minHeight: "250px", padding: "1rem" }}>
            <Stack gap={3}>
                {status !== undefined && (
                    <Stack direction="row" sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                        <Chip label={chipLabel.label} color={chipLabel.type} />
                    </Stack>
                )}
                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                    Transaction ID:
                </Typography>

                <Typography variant="body1">{id}</Typography>

                {extra !== undefined && (
                    <>
                        <Divider flexItem />

                        <Typography sx={{ fontWeight: "bold" }} variant="body1">
                            Transaction Information:
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Typography variant="body1">Sender Address:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {extra.from}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1">Receiver Address:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {extra.to}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1">Amount:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {extra.amount}
                                </Typography>
                            </Grid>
                        </Grid>
                    </>
                )}

                <Divider flexItem />

                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                    Transaction Inputs:
                </Typography>

                <Grid container spacing={3}>
                    {transactionIns.map((txIn, index) => (
                        <Fragment key={txIn.transactionOutIndex}>
                            <Grid item xs={6}>
                                <Typography variant="body1">Transaction Output ID:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {txIn.transactionOutId}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1">Transaction Output Index:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {txIn.transactionOutIndex}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1">Signature:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {txIn.signature}
                                </Typography>
                            </Grid>
                            {index < transactionIns.length - 1 && (
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            height: "20px",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Divider sx={{ width: "150px" }} />
                                    </Box>
                                </Grid>
                            )}
                        </Fragment>
                    ))}
                </Grid>

                <Divider flexItem />

                <Typography sx={{ fontWeight: "bold" }} variant="body1">
                    Transaction Outputs:
                </Typography>

                <Grid container spacing={3}>
                    {transactionOuts.map((txOut, index) => (
                        <Fragment key={index}>
                            <Grid item xs={6}>
                                <Typography variant="body1">Receiver Address:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {txOut.address}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body1">Amount:</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                                    {txOut.amount}
                                </Typography>
                            </Grid>
                            {index < transactionOuts.length - 1 && (
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            height: "20px",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Divider sx={{ width: "150px" }} />
                                    </Box>
                                </Grid>
                            )}
                        </Fragment>
                    ))}
                </Grid>
            </Stack>
        </Card>
    );
}
