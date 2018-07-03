import discord from 'discord.js';
import terminalImage from 'terminal-image';
import { getLogger } from './logger';

export function fakeMember() {
    const member = {
        user: {
            username: 'OFFLINE-USER',
            displayAvatarURL: 'https://cataas.com/cat'
        }
    }
    return member
}

/** Exposes an logger that matches a channel interface */
export function channelLogger() {
    const logger = getLogger();
    const channel = {
        send: async (input: any, attach: discord.Attachment) => {
            if (!attach) {
                logger.debug(input)
                return;
            }
            const img = await terminalImage.buffer(attach.attachment);
            logger.debug(input);
            console.log(img);
        }
    }
    return channel;
}