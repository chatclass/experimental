export interface EvolutionMessageRow {
    id: string;
    key: any; // jsonb
    pushName: string | null;
    participant: string | null;
    messageType: string;
    message: any; // jsonb
    contextInfo: any | null;
    source: string;
    messageTimestamp: number; // seconds
    instanceId: string;
}

export interface MapperContext {
    tenantId: string;
    channel_id: string; // ev:<cloud_id>:<instance_id>
}



