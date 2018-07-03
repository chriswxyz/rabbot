// The commands that rabbot recognizes

/** Record a show to watch */
type WatchShow = {
    cmdType: 'watch';
    title: string;
}

/** List recorded shows */
type ListShows = {
    cmdType: 'list';
}

/** Find a show */
type SearchShow = {
    cmdType: 'search';
    input: string;
    query: string;
}

/** Simulate joining the server for the first time */
type Join = {
    cmdType: 'join';
    canvas: any;
}

/** Get help with these commands */
type Help = {
    cmdType: 'help';
}

/** Print some fancy ascii text */
type Ascii = {
    cmdType: 'ascii';
    text: string;
}

/** Show a picture of a cat with optional text */
type Cat = {
    cmdType: 'cat';
    url: string;
}

/** Ping rabbot */
type Ping = { cmdType: 'ping'; }

/** Github information */
type About = { cmdType: 'about'; }

/** Not a recognized command */
export type NotACommand = { cmdType: 'not-command'; }

export type RabbotCommand = WatchShow
    | ListShows
    | SearchShow
    | Ping
    | Join
    | Ascii
    | Cat
    | Help
    | About
    ;