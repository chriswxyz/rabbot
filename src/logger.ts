import winston from 'winston';
const { combine, json } = winston.format;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: combine(
                json()
            )
        })
    ]
});

export function getLogger(): winston.Logger {
    return logger;
}