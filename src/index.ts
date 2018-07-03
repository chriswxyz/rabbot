import discord, { Message } from 'discord.js';
import dotenv from 'dotenv';
import Jimp from 'jimp';
import { getLogger } from './logger';
import { createCommandParser, createGreetingImage, AppConfig, handleMessage } from './messages';
import readline from 'readline';
import terminalImage from 'terminal-image';

const logger = getLogger();

// Get tokens and other secrets.
const config = dotenv.config();
if (config.error) {
    logger.error('Could not load .env config:')
    logger.error(config.error);
}

// Create media objects.
async function loadAppConfig(botId: string): Promise<AppConfig> {
    const tuturu = await Jimp.read('./media/tuturu.png');
    tuturu.scaleToFit(150, 150);
    tuturu.contain(300, 150, Jimp.HORIZONTAL_ALIGN_RIGHT);
    return {
        Tuturu: () => tuturu.clone(),
        botId: () => botId
    };
}

let staticMedia: AppConfig;
let botId;

// Set up bot handlers
async function blastOffDiscord() {
    const bot = new discord.Client();
    bot.on('ready', async () => {
        logger.info('READY!');
        staticMedia = await loadAppConfig(bot.user.id);

        const commandParser = createCommandParser(staticMedia);
        bot.on('message', m => handleMessage(m, commandParser, staticMedia));

        bot.on('debug', x => logger.debug(x));
        bot.on('error', e => logger.error(e));
        bot.on('guildMemberAdd', handleServerAdd)
    });
    bot.login(process.env.DISCORD_BOT_TOKEN);
}

async function blastOffCli() {
    logger.debug('In offline mode!');
    staticMedia = await loadAppConfig('OFFLINE-BOT');

    const commandParser = createCommandParser(staticMedia);
    const member = {
        user: {
            username: 'OFFLINE-USER',
            displayAvatarURL: 'https://cataas.com/cat'
        }
    }

    const consoleIn = readline.createInterface(process.stdin, process.stdout);
    consoleIn.setPrompt('rabbot>');
    consoleIn.prompt();
    consoleIn.on('line', async content => {
        const msg = {
            content,
            member,
            channel: {
                send: async (input: any, attach: discord.Attachment) => {
                    if (!attach) {
                        logger.debug(input)
                        return;
                    }
                    const img = await terminalImage.buffer(attach.attachment);
                    logger.debug(input);
                    console.log(img);
                }
            },
            reply: logger.debug
        } as any;

        await handleMessage(msg, commandParser, staticMedia)
        consoleIn.prompt();
    })
}

const isOnline = process.argv[2] === "--online";

if (isOnline) {
    blastOffDiscord();
} else {
    blastOffCli();
}


async function handleServerAdd(member: discord.GuildMember) {
    const channel = member.guild.channels.find('name', 'general') as discord.TextChannel;
    const attach = await createGreetingImage(member.user, staticMedia);
    await channel.send(`Tuturu, ${member.user.username}!`, attach);
    return;
}

