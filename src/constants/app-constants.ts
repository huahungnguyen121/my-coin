export const APP_CONSTANTS = {
    HTTP_PORT: process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) || 5000 : 5000,
    SOCKET_PORT: process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) || 5001 : 5001,
    ALLOW_ORIGINS: process.env.ALLOW_ORIGINS
        ? process.env.ALLOW_ORIGINS === "*"
            ? process.env.ALLOW_ORIGINS
            : process.env.ALLOW_ORIGINS.split(" ")
        : "*",
};
