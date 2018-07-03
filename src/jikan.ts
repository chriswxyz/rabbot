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
