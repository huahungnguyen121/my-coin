import { createBrowserRouter, Outlet, RouteObject } from "react-router-dom";
import Header from "../components/header";
import Home from "../pages/home/Home";
import { Container } from "@mui/material";
import Wallet from "../pages/wallet";
import TransactionHistory from "../pages/transaction-history";

const routes: RouteObject[] = [
    {
        path: "/",
        element: (
            <>
                <Header />
                <Container id="content-container" maxWidth="lg">
                    <Outlet />
                </Container>
            </>
        ),
        children: [
            {
                path: "",
                element: <Home />,
            },
            {
                path: "my-wallet",
                element: <Wallet />,
            },
            {
                path: "transaction-history",
                element: <TransactionHistory />,
            },
        ],
    },
];

export const router = createBrowserRouter(routes);
