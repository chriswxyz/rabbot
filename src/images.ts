import discord from 'discord.js';
import Jimp from 'jimp';

/**
 * Creates an attachment from a source Jimp image.
 * @param input Source image
 * @param title Name of the file, without extensions
 */
export async function jimpToAttachment(input: Jimp, title: string | null): Promise<discord.MessageAttachment> {
    const buf = await getBuffer(input);
    const attach = new discord.MessageAttachment(buf, `${title || 'untitled'}.png`);
    return attach
}

async function getBuffer(input: Jimp): Promise<Buffer> {
    return new Promise<Buffer>((res, rej) => {
        input.getBuffer(Jimp.MIME_PNG, (ex, buf) => {
            if (!ex) {
                res(buf);
            }

            rej(ex);
        })
    });
}