import dotenv from 'dotenv';
import Jimp from 'jimp';
import { getLogger } from './logger';

export interface AppConfig {
    result: 'parsed';
    botToken: () => string;
    Tuturu: () => Jimp;
}

export interface ConfigError {
    result: 'error'
    error: Error
}

/** Load secret tokens and other static data */
export async function loadAppConfig(): Promise<AppConfig | ConfigError> {
    const logger = getLogger();

    const tuturu = await Jimp.read('./media/tuturu.png');
    tuturu.scaleToFit(150, 150);
    tuturu.contain(300, 150, Jimp.HORIZONTAL_ALIGN_RIGHT);

    const config = dotenv.config();

    if (config.error) {
        return { result: 'error', error: config.error };
    }

    return {
        result: 'parsed',
        Tuturu: () => tuturu.clone(),
        botToken: () => process.env.DISCORD_BOT_TOKEN!
    };
}