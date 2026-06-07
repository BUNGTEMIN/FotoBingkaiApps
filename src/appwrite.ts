import { Client, Storage, Databases, Query, ID } from "appwrite";

// ==========================================
// SERVER 1: LIKES & DATABASE (PREVIOUS SERVER)
// ==========================================
const likeClient = new Client();
const likeEndpoint = import.meta.env.VITE_APPWRITE_LIKE_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const likeProjectId = import.meta.env.VITE_APPWRITE_LIKE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

console.log("Appwrite Likes Client Init:", { endpoint: likeEndpoint, projectId: likeProjectId || "not set" });

if (likeProjectId && likeProjectId !== 'YOUR_PROJECT_ID' && likeProjectId !== 'YOUR_LIKE_PROJECT_ID') {
    likeClient.setEndpoint(likeEndpoint).setProject(likeProjectId);
} else {
    console.warn("Appwrite Likes Client standard initialization deferred: Project ID missing or placeholder");
}

export const databases = new Databases(likeClient);
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_LIKE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID || 'server_logs_db';
export const COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIKE_COLLECTION_ID || import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'twlike';

// ==========================================
// SERVER 2: STORAGE & UPLOADS (NEW SERVER)
// ==========================================
const storageClient = new Client();
const storageEndpoint = import.meta.env.VITE_APPWRITE_STORAGE_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const storageProjectId = import.meta.env.VITE_APPWRITE_STORAGE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

console.log("Appwrite Storage Client Init:", { endpoint: storageEndpoint, projectId: storageProjectId || "not set" });

if (storageProjectId && storageProjectId !== 'YOUR_PROJECT_ID' && storageProjectId !== 'YOUR_STORAGE_PROJECT_ID') {
    storageClient.setEndpoint(storageEndpoint).setProject(storageProjectId);
} else {
    console.warn("Appwrite Storage Client standard initialization deferred: Project ID missing or placeholder");
}

export const storage = new Storage(storageClient);
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID === 'YOUR_STORAGE_BUCKET_ID' 
    ? '' 
    : (import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || (import.meta.env.VITE_APPWRITE_BUCKET_ID === 'YOUR_BUCKET_ID' ? '' : (import.meta.env.VITE_APPWRITE_BUCKET_ID || '')));

console.log("Appwrite Storage Bucket ID:", BUCKET_ID || "not set");

export { Query, ID };
