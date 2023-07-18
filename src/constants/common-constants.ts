export enum MESSAGE_TYPE {
    GET_LASTEST_BLOCK,
    GET_ENTIRE_CHAIN,
    RECEIVE_CHAIN,
}

export type TMessage = {
    type: MESSAGE_TYPE;
    data: string;
};

export const SOCKET_EVENT_NAME = {
    RECEIVED_MSG: "message",
} as const;

export const BLOCKCHAIN_DEFAULT_CONFIGS = {
    /**
     * Second
     */
    BLOCK_GENERATION_INTERVAL: 10,
    /**
     * Block
     */
    DIFFICULTY_ADJUSTMENT_INTERVAL: 10,
};
