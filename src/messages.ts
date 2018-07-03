import axios from 'axios';
import discord from 'discord.js';
import figlet from 'figlet';
import * as I from 'immutable';
import Jimp from 'jimp';
import querystring from 'querystring';
import { NotACommand, RabbotCommand } from './commands';
import { AppConfig } from './config';
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
    const shouldIgnore = !message.content.startsWith('!') || message.member.user.id === botId;
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
        const query = `https://api.jikan.moe/search/anime?${qs}`
        return { cmdType, query, input };
    }

    if (cmdType === 'figlet') {
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

    if (cmdType === 'help') { return { cmdType }; }

    return { cmdType: 'not-command' };
}


//TODO real storage implementation
let shows: I.Set<string> = I.Set<string>();

export async function handleMessage(message: discord.Message, parseCommand: CommandParser, appConfig: AppConfig) {
    const cmd = parseCommand(message);
    const logger = getLogger();
    switch (cmd.cmdType) {
        case 'watch': {
            shows = shows.add(cmd.title);
            message.reply(`OK! You want to watch ${cmd.title}~`)
            return;
        }
        case 'list': {
            message.reply(`Here's what I know~\n`);
            const showList = shows.join('\n');
            message.channel.send(showList);
            return;
        }
        case 'search': {
            const searchResponse = await axios.get<JikanResponse>(cmd.query);
            logger.debug(`Search for ${cmd.input}`);

            const results = searchResponse.data.result.slice(0, 3);
            const ems = results.map(r => new discord.RichEmbed({
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
                '!figlet [text]'
            ].join('\n');
            await channel.send(help);
            return;
        }
        case 'figlet': {
            await message.channel.send(cmd.text);
            return;
        }
        case 'cat': {
            const attach = await getCatPic(cmd.url);
            await message.channel.send('Meow~', attach);
            return
        }
        default: { }
    }
}

export async function createGreetingImage(user: discord.User, appConfig: AppConfig) {
    const avatar = await Jimp.read(user.displayAvatarURL);
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

