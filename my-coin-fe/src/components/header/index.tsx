import { AppBar, Box, Button, Container, Typography } from "@mui/material";
import "./style.css";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <AppBar color="primary" position="fixed" className="header-container">
            <Container maxWidth="lg" sx={{ display: "flex", justifyContent: "space-between" }}>
                <Link to="/">
                    <Typography variant="h6">MYCOIN EXPLORER</Typography>
                </Link>

                <Box sx={{ display: "flex", gap: "1rem" }}>
                    <Button variant="text" style={{ color: "white" }} onClick={() => handleNavigate("/my-wallet")}>
                        My Wallet
                    </Button>
                    <Button
                        variant="text"
                        style={{ color: "white" }}
                        onClick={() => handleNavigate("/transaction-history")}
                    >
                        Transaction History
                    </Button>
                </Box>
            </Container>
        </AppBar>
    );
}
