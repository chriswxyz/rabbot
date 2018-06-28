type WatchShow = {
    cmdType: 'watch';
    title: string;
}

type ListShows = {
    cmdType: 'list';
}

type SearchShow = {
    cmdType: 'search';
    input: string;
    query: string;
}

type Join = {
    cmdType: 'join';
    canvas: any;
}

type Help = {
    cmdType: 'help';
}

type Ping = { cmdType: 'ping'; }

type Unknown = { cmdType: 'unknown'; }
export type NotACommand = { cmdType: 'not-command'; }

export type RabbotCommand = WatchShow
    | ListShows
    | SearchShow
    | Ping
    | Join
    | Help
    | Unknown
    ;