import { Client, Storage } from "appwrite";

const client = new Client();
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

if (projectId && projectId !== 'YOUR_PROJECT_ID') {
    client.setEndpoint(endpoint).setProject(projectId);
}

export const storage = new Storage(client);
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID === 'YOUR_BUCKET_ID' ? '' : (import.meta.env.VITE_APPWRITE_BUCKET_ID || '');
