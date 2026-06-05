import { Client, Storage, Databases, Query, ID } from "appwrite";

const client = new Client();
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

console.log("Appwrite Init:", { endpoint, projectId: projectId || "not set" });

if (projectId && projectId !== 'YOUR_PROJECT_ID') {
    client.setEndpoint(endpoint).setProject(projectId);
} else {
    console.warn("Appwrite Client not initialized correctly: Project ID missing or default");
}

export const storage = new Storage(client);
export const databases = new Databases(client);
export { Query, ID };

export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID === 'YOUR_BUCKET_ID' ? '' : (import.meta.env.VITE_APPWRITE_BUCKET_ID || '');
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'server_logs_db';
export const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'twlike';

console.log("Appwrite Bucket:", BUCKET_ID || "not set");
