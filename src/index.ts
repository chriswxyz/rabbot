import axios from 'axios';
import discord, { Message } from 'discord.js';
import dotenv from 'dotenv';
import * as I from 'immutable';
import Jimp from 'jimp';
import querystring from 'querystring';
import * as util from 'util';
import { NotACommand, RabbotCommand } from './commands';

// Get tokens and other secrets.
const config = dotenv.config();
if (config.error) {
    err('Could not load .env config:')
    err(config.error);
}

// Create media objects.
interface StaticMedia {
    Tuturu: () => Jimp;
}

async function loadMedia(): Promise<StaticMedia> {
    const tuturu = await Jimp.read('./media/tuturu.png');
    tuturu.scaleToFit(150, 150);
    tuturu.contain(300, 150, Jimp.HORIZONTAL_ALIGN_RIGHT);
    return {
        Tuturu: () => tuturu.clone()
    };
}

let staticMedia: StaticMedia;
let botId;

// Set up bot handlers
async function blastOff() {
    staticMedia = await loadMedia();
    const bot = new discord.Client();
    bot.on('ready', () => {
        debug('READY!');
        botId = bot.user.id;
    });
    bot.on('message', handleMessage);
    bot.on('debug', debug);
    bot.on('error', err);
    bot.on('guildMemberAdd', handleServerAdd)
    bot.login(process.env.DISCORD_BOT_TOKEN);
}

blastOff();

/**
 * Decide which command a message corresponds to.
 * @param message The sent message
 */
function parseCommand(message: discord.Message): RabbotCommand | NotACommand {
    const shouldIgnore = !message.content.startsWith('!') || message.member.user.id === botId;
    if (shouldIgnore) { return { cmdType: 'not-command' } }

    debug(`Command: ${message.content}`);
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

    if (cmdType === 'search') {
        const input = args.slice(1).join(' ');
        const qs = querystring.stringify({ q: input, page: 1 });
        const query = `https://api.jikan.moe/search/anime?${qs}`
        return { cmdType, query, input };
    }

    if (cmdType === 'join') {
        return { cmdType, canvas: '' }
    }

    if (cmdType === 'ping') {
        return { cmdType };
    }

    if (cmdType === 'help') { return { cmdType }; }

    return { cmdType: 'unknown' };
}

let shows: I.Set<string> = I.Set<string>();

async function handleServerAdd(member: discord.GuildMember) {
    const channel = member.guild.channels.find('name', 'general') as discord.TextChannel;
    const attach = await createGreetingImage(member.user);
    await channel.send(`Tuturu, ${member.user.username}!`, attach);
    return;
}

async function handleMessage(message: discord.Message) {
    const cmd = parseCommand(message);
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
            debug(`Search for ${cmd.input}`);

            const results = searchResponse.data.result.slice(0, 3);
            const ems = results.map(r => new discord.RichEmbed({
                title: r.title,
                description: r.description,
                url: r.url,
                thumbnail: { url: r.image_url }
            }));
            results.forEach(x => debug(`Found: ${x.title} (${x.mal_id})`));

            if (!any(results)) {
                await message.channel.send('I couldn\'t find anything~');
                return;
            }

            await message.channel.send('I found this~');
            await Promise.all(ems.map(x => message.channel.send(x)));

            return;
        }
        case 'join': {
            const attach = await createGreetingImage(message.member.user);
            await message.channel.send(`Tuturu, ${message.member.user.username}!`, attach);
            return;
        }
        case 'help': {
            const { channel } = message;
            const help = [
                '!watch [title]',
                '!list',
                '!search [title]',
            ].join('\n');
            await channel.send(help);
        }
        case 'unknown': {
            //message.reply(`I don't know what you mean!~`);
            return;
        }
        default: { }
    }
}

async function createGreetingImage(user: discord.User) {
    const avatar = await Jimp.read(user.displayAvatarURL);
    avatar.scaleToFit(150, 150);
    const copy = staticMedia.Tuturu();
    copy.composite(avatar, 0, 0);
    const buf = await getBuffer(copy);
    const attach = new discord.Attachment(buf, 'hello.png');
    return attach;
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


function debug(content: any) {
    const text = typeof (content) === "string"
        ? content
        : util.inspect(content);
    console.log(`[DEBUG]: ${text}`);
}

function err(content: any) {
    const text = typeof (content) === "string"
        ? content
        : util.inspect(content);
    console.log(`[ERROR]: ${text}`);
}

function any<T>(arr: T[]) {
    return arr.length > 0;
}

export interface JikanResult {
    mal_id: number;
    url: string;
    image_url: string;
    title: string;
    description: string;
    type: string;
    score: number;
    episodes: number;
    members: number;
}

export interface JikanResponse {
    request_hash: string;
    request_cached: boolean;
    result: JikanResult[];
    result_last_page: number;
}
