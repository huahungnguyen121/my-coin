import elliptic from "elliptic";
const EC = elliptic.ec;

class ECSingleton {
    static ec: elliptic.ec | null;

    getInstance(): elliptic.ec {
        if (ECSingleton.ec == null) {
            const instance = new EC("secp256k1");
            ECSingleton.ec = instance;
            return instance;
        }

        return ECSingleton.ec;
    }
}

// Create and initialize EC context
const ec = new ECSingleton().getInstance();

const genKeyPair = () => {
    return ec.genKeyPair();
};

const getPublicKeyFromPrivateKey = (privateKey: string) => {
    return ec.keyFromPrivate(privateKey, "hex").getPublic("hex");
};

export { ec, genKeyPair, getPublicKeyFromPrivateKey };
