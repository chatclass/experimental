import { MongoClient, Db } from 'mongodb';
import { hubConfig } from '../config/hubenv.js';

/**
 * Hub MongoDB connection management.
 * 
 * This module provides connection management for the Hub MongoDB database,
 * which contains event data from various messaging platforms. It implements
 * singleton pattern to ensure only one connection is maintained per process.
 */

let hubClient: MongoClient | null = null;
let hubDb: Db | null = null;

/**
 * Gets or creates a MongoDB client connection to the Hub database.
 * 
 * This function implements a singleton pattern to ensure only one client
 * connection is maintained throughout the application lifecycle. The connection
 * is lazily initialized on first use.
 * 
 * @returns Promise resolving to the MongoDB client instance
 * 
 * @example
 * ```typescript
 * const client = await getHubClient();
 * const db = client.db('data');
 * const collection = db.collection('message');
 * ```
 */
export async function getHubClient(): Promise<MongoClient> {
    if (!hubClient) {
        hubClient = new MongoClient(hubConfig.hubMongoUri);
        await hubClient.connect();
    }
    return hubClient;
}

/**
 * Gets or creates a MongoDB database instance for the Hub database.
 * 
 * This function provides convenient access to the Hub database instance.
 * It uses the singleton client connection and returns the 'data' database
 * which contains the message events.
 * 
 * @returns Promise resolving to the MongoDB database instance
 * 
 * @example
 * ```typescript
 * const db = await getHubDb();
 * const collections = await db.listCollections().toArray();
 * console.log('Available collections:', collections.map(c => c.name));
 * ```
 */
export async function getHubDb(): Promise<Db> {
    if (!hubDb) {
        const cli = await getHubClient();
        hubDb = cli.db('data');
    }
    return hubDb;
}

/**
 * Closes the Hub MongoDB connection and cleans up resources.
 * 
 * This function should be called when the application is shutting down
 * to properly close the MongoDB connection and free up resources.
 * It's safe to call multiple times as it checks if the client exists.
 * 
 * @returns Promise that resolves when the connection is closed
 * 
 * @example
 * ```typescript
 * try {
 *   // Use the database
 *   const db = await getHubDb();
 *   // ... do work
 * } finally {
 *   await closeHubMongo();
 * }
 * ```
 */
export async function closeHubMongo(): Promise<void> {
    if (hubClient) {
        await hubClient.close();
        hubClient = null;
        hubDb = null;
    }
}


