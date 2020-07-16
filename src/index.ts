import discord from 'discord.js';
import readline from 'readline';
import { AppConfig, loadAppConfig } from './config';
import { getLogger } from './logger';
import { createCommandParser, createGreetingImage, handleMessage } from './messages';
import { channelLogger, fakeMember } from './offline';

//========
// Start!
//========
const logger = getLogger();
const isOnline = process.argv[2] === "--online";

isOnline
    ? blastOffDiscord()
    : blastOffCli();

// Set up bot handlers
async function blastOffDiscord() {
    const bot = new discord.Client();
    const config = await loadAppConfig();

    if (config.result === 'error') {
        logger.error('Could not load app config:');
        logger.error(config.error);
        process.exit(1);
        return;
    }

    bot.on('ready', async () => {
        logger.info('READY!');

        if (!bot.user) {
            logger.error('Could not get bot user! How can this be?');
            return;
        }

        const commandParser = createCommandParser(bot.user.id, config);
        bot.on('message', m => handleMessage(m, commandParser, config));

        bot.on('debug', x => logger.debug(x));
        bot.on('error', e => logger.error(e));
        bot.on('guildMemberAdd', x => handleServerAdd(x, config))
    });
    bot.login(config.botToken());
}

async function handleServerAdd(member: discord.GuildMember | discord.PartialGuildMember, config: AppConfig) {
    const channel = member.guild.channels.resolve('general') as discord.TextChannel;
    const user = member.user;
    if (!channel) {
        logger.error('No general channel found.')
        return;
    }
    if (!user) {
        logger.error('No user found for this member.');
        return;
    }
    const attach = await createGreetingImage(user, config);
    await channel.send(`Tuturu, ${user.username}!`, attach);
    return;
}

async function blastOffCli() {
    logger.debug('READY! (offline)');
    const config = await loadAppConfig();

    if (config.result === 'error') {
        logger.error('Could not load app config:');
        logger.error(config.error);
        process.exit(1);
        return;
    }

    const commandParser = createCommandParser('OFFLINE-BOT', config);
    const member = fakeMember();
    const channel = channelLogger();

    const consoleIn = readline.createInterface(process.stdin, process.stdout);
    consoleIn.setPrompt('rabbot> ');
    consoleIn.prompt();
    consoleIn.on('line', async content => {
        const msg = {
            content,
            member,
            channel,
            reply: (x: string) => logger.debug(x)
        } as any;

        await handleMessage(msg, commandParser, config)
        consoleIn.prompt();
    })
}
