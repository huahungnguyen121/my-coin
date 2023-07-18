import { TransactionIn } from "../blockchain/transaction";
import { MESSAGE_TYPE, TMessage } from "../constants/common-constants";
import _ from "lodash";

export const parseJSON = <T>(jsonString: string): T | null => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.log("parseJSON: ", error);
        return null;
    }
};

export const buildMsg = (msgType: MESSAGE_TYPE, data?: any): TMessage => {
    return {
        type: msgType,
        data: JSON.stringify(data),
    };
};

export const secondToMilisec = (m: number): number => {
    if (isNaN(m)) return NaN;

    return m * 1000;
};

export const toHexString = (byteArray: any): string => {
    return Array.from(byteArray, (byte: any) => {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
};

export const hasDuplicates = (txIns: TransactionIn[]): boolean => {
    const groups = _.countBy(txIns, (txIn: TransactionIn) => txIn.transactionOutId + txIn.transactionOutIndex);
    return _(groups)
        .map((value, key) => {
            if (value > 1) {
                console.log("Duplicate txIn: " + key);
                return true;
            } else {
                return false;
            }
        })
        .includes(true);
};
