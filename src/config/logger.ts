import pino from 'pino';
import { config } from './env.js';

const isDev = config.nodeEnv !== 'production';

export const logger = pino(
    isDev
        ? {
            level: 'debug',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                },
            },
        }
        : { level: 'info' }
);



