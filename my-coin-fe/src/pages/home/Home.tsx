import { Button, Stack, Typography } from "@mui/material";
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
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Welcome to MYCOIN
                </Typography>

                <Button size="large" variant="contained" onClick={() => handleNavigate("/my-wallet")}>
                    Access my wallet
                </Button>
            </Stack>
        </div>
    );
}

export default Home;
