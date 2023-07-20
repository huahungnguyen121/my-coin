import { CircularProgress, Box } from "@mui/material";

export default function Loading() {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "1rem",
            }}
        >
            <CircularProgress color="secondary" />
            Loading, please wait ...
        </Box>
    );
}
