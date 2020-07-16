import discord, { BufferResolvable } from 'discord.js';
import terminalImage from 'terminal-image';
import { getLogger } from './logger';
import { Stream } from 'stream';

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
        send: async (input: any, attach: discord.MessageAttachment) => {
            if (!attach) {
                logger.debug(input)
                return;
            }

            let img = '[NO IMAGE]';

            if (isBuffer(attach.attachment)) {
                img = await terminalImage.buffer(attach.attachment);
            }

            logger.debug(input);
            console.log(img);
        }
    }
    return channel;
}

function isBuffer(attach: BufferResolvable | Stream): attach is Buffer {
    if (typeof (attach) === 'string') {
        return false;
    }

    return true;
}