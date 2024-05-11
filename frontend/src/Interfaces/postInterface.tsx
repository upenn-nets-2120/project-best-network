export interface Post {
    title: string;
    content: string;
    parent_id: number | null;
    hashtags: string[];
    username: string;
}