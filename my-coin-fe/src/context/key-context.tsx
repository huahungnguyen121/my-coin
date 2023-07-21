import { createContext, useContext, useState, useCallback } from "react";

interface IKeyContext {
    privateKey: string;
    publicKey: string;
    changePublicKey: (publicKey: string) => void;
    changePrivateKey: (privateKey: string) => void;
}

const KeyContext = createContext<IKeyContext | null>(null);

export const KeyContextProvider = (props: { children?: React.ReactNode }) => {
    const [myPrivateKey, setMyPrivateKey] = useState<string>("");
    const [myPublicKey, setMyPublicKey] = useState<string>("");

    const changePrivateKey = useCallback((privateKey: string) => {
        setMyPrivateKey(privateKey);
    }, []);

    const changePublicKey = useCallback((publicKey: string) => {
        setMyPublicKey(publicKey);
    }, []);

    return (
        <KeyContext.Provider
            value={{
                privateKey: myPrivateKey,
                publicKey: myPublicKey,
                changePrivateKey,
                changePublicKey,
            }}
        >
            {props.children}
        </KeyContext.Provider>
    );
};

export const useKeyContext = () => {
    const keyContext = useContext(KeyContext);

    if (keyContext == null) throw new Error("KeyContext does not exist");

    return keyContext;
};
