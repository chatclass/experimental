import 'dotenv/config';

export interface HubConfig {
    hubMongoUri: string;
}

export const hubConfig: HubConfig = {
    hubMongoUri: (() => {
        const v = process.env['HUB_MONGODB_URI'];
        if (v && v.trim().length > 0) return v;
        throw new Error('Missing required env var HUB_MONGODB_URI');
    })(),
};


