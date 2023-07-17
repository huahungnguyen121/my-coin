import { MESSAGE_TYPE, TMessage } from "../constants/common-constants";

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

export const minuteToMilisec = (m: number): number => {
    if (isNaN(m)) return NaN;

    return m * 60 * 1000;
};
