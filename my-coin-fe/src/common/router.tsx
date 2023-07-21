import { createBrowserRouter, Outlet, RouteObject } from "react-router-dom";
import Header from "../components/header";
import Home from "../pages/home/Home";
import { Container } from "@mui/material";
import Wallet from "../pages/wallet";
import TransactionHistory from "../pages/transaction-history";
import CreateWallet from "../pages/wallet/create-wallet";
import { KeyContextProvider } from "../context/key-context";

const routes: RouteObject[] = [
    {
        path: "/",
        element: (
            <KeyContextProvider>
                <Header />
                <Container id="content-container" maxWidth="lg">
                    <Outlet />
                </Container>
            </KeyContextProvider>
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
                path: "create-wallet",
                element: <CreateWallet />,
            },
            {
                path: "my-transaction",
                element: <TransactionHistory />,
            },
        ],
    },
];

export const router = createBrowserRouter(routes);
