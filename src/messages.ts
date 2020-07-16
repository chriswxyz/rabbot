import axios from 'axios';
import discord from 'discord.js';
import figlet from 'figlet';
import * as I from 'immutable';
import Jimp from 'jimp';
import querystring from 'querystring';
import { NotACommand, RabbotCommand } from './commands';
import { AppConfig } from './config';
import { crankGacha } from './gacha';
import { jimpToAttachment } from './images';
import { JikanResponse } from './jikan';
import { getLogger } from './logger';

export function createCommandParser(botId: string, appConfig: AppConfig) {
    return (message: discord.Message) => parseCommand(message, botId, appConfig);
}

type CommandParser = (message: discord.Message) => RabbotCommand | NotACommand;

/**
 * Decide which command a message corresponds to.
 * @param message The sent message
 */
function parseCommand(message: discord.Message, botId: string, appConfig: AppConfig): RabbotCommand | NotACommand {
    const hasBang = message.content.startsWith('!');
    const member = message.member;
    if (!member) { return { cmdType: 'not-command' }; }

    const isThisBot = member.user.id === botId;

    const shouldIgnore = !hasBang || isThisBot;
    if (shouldIgnore) { return { cmdType: 'not-command' } }
    const logger = getLogger();

    logger.debug(`Command: ${message.content}`);
    const input = message.content.slice(1);
    const args = input.split(' ');
    const cmdType = args[0];

    if (cmdType == 'watch') {
        const title = args.slice(1).join(' ');
        return { cmdType, title };
    }

    if (cmdType === 'list') {
        return { cmdType };
    }

    if (cmdType === 'cat') {
        const text = args.slice(1);
        const url = any(text)
            ? `https://cataas.com/cat/says/${querystring.escape(text.join(' '))}`
            : `https://cataas.com/cat`;
        return { cmdType, url };
    }

    if (cmdType === 'search') {
        const input = args.slice(1).join(' ');
        const qs = querystring.stringify({ q: input, page: 1 });
        const query = `https://api.jikan.moe/v3/search/anime?${qs}`
        logger.debug(query);
        return { cmdType, query, input };
    }

    if (cmdType === 'ascii') {
        const input = args.slice(1).join(' ');
        const output: string = figlet.textSync(input).trim();
        const text = `\`\`\`${output}\`\`\``;

        return { cmdType, text };
    }

    if (cmdType === 'join') {
        return { cmdType, canvas: '' }
    }

    if (cmdType === 'ping') {
        return { cmdType };
    }
    if (cmdType === 'gacha') { return { cmdType }; }
    if (cmdType === 'help') { return { cmdType }; }
    if (cmdType === 'about') { return { cmdType }; }

    return { cmdType: 'not-command' };
}


//TODO real storage implementation
let shows: I.Set<string> = I.Set<string>();

export async function handleMessage(message: discord.Message, parseCommand: CommandParser, appConfig: AppConfig) {
    const cmd = parseCommand(message);
    const logger = getLogger();
    try {
        switch (cmd.cmdType) {
            case 'watch': {
                shows = shows.add(cmd.title);
                message.reply(`OK! You want to watch ${cmd.title}~`)
                return;
            }
            case 'list': {
                logger.debug('aaaaa');
                message.reply(`Here's what I know~\n`);
                const showList = shows.join('\n');
                message.channel.send(showList);
                return;
            }
            case 'search': {
                const searchResponse = await axios.get<JikanResponse>(cmd.query);
                logger.debug(`Search for ${cmd.input}`);

                const results = searchResponse.data.results.slice(0, 3);
                const ems = results.map(r => new discord.MessageEmbed({
                    title: r.title,
                    description: r.description,
                    url: r.url,
                    thumbnail: { url: r.image_url }
                }));
                results.forEach(x => logger.debug(`Found: ${x.title} (${x.mal_id})`));

                if (!any(results)) {
                    await message.channel.send('I couldn\'t find anything~');
                    return;
                }

                await message.channel.send('I found this~');
                await Promise.all(ems.map(x => message.channel.send(x)));

                return;
            }
            case 'join': {
                if (!message.member) {
                    return;
                }
                const attach = await createGreetingImage(message.member.user, appConfig);
                await message.channel.send(`Tuturu, ${message.member.user.username}!`, attach);
                return;
            }
            case 'help': {
                const { channel } = message;
                const help = [
                    '!watch [title]',
                    '!list',
                    '!search [title]',
                    '!cat <text>',
                    '!ascii [text]'
                ].join('\n');
                await channel.send(help);
                return;
            }
            case 'ascii': {
                await message.channel.send(cmd.text);
                return;
            }
            case 'cat': {
                const attach = await getCatPic(cmd.url);
                await message.channel.send('Meow~', attach);
                return
            }
            case 'gacha': {
                if (!message.member) {
                    return;
                }

                const ball = crankGacha();

                await message.channel.send('Crank~ Pon!');
                await message.channel.send(`${message.member.user.username}'s gacha ball contained:`);
                await message.channel.send(`${ball.gold} gold pieces`)
                await message.channel.send(`${ball.xp} XP`)
                await Promise.all(ball.items.map(x => message.channel.send(x.title)))
                return;
            }
            case 'about': {
                await message.channel.send('https://github.com/chriswxyz/rabbot');
                return;
            }
            default: { }
        }
    } catch (e) {
        logger.error(e);
    }
}

export async function createGreetingImage(user: discord.User, appConfig: AppConfig) {
    let avatarUrl = user.avatarURL() || user.defaultAvatarURL;
    const avatar = await Jimp.read(avatarUrl);
    avatar.scaleToFit(150, 150);
    const copy = appConfig.Tuturu();
    copy.composite(avatar, 0, 0);
    const attach = jimpToAttachment(copy, 'hello');
    return attach;
}

async function getCatPic(url: string) {
    const cat = await Jimp.read(url);
    const attach = jimpToAttachment(cat, 'cat');
    return attach;
}

function any<T>(arr: T[]) {
    return arr.length > 0;
}

