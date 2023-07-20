import { Button, Stack, Box } from "@mui/material";
import "./Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <div className="home-container">
            <Stack gap={3}>
                <h1>Welcome to MYCOIN</h1>

                <Box>How can I help you?</Box>

                <Button size="large" variant="contained" onClick={() => handleNavigate("/my-wallet")}>
                    View my wallet
                </Button>

                <Button size="large" variant="contained" onClick={() => handleNavigate("/transaction-history")}>
                    View transaction history
                </Button>
            </Stack>
        </div>
    );
}

export default Home;
