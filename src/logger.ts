import winston from 'winston';
const { combine, colorize, timestamp, printf } = winston.format;

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: combine(
                colorize(),
                timestamp(),
                printf(info => `[${info.level}] ${info.message}`)
            )
        })
    ]
});

export function getLogger(): winston.Logger {
    return logger;
}