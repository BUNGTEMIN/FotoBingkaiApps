import { Client, Storage, Databases, Query, ID } from "appwrite";
import axios from "axios";

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

export async function ensureAppwriteBucketExists(bucketId: string, bucketName: string): Promise<boolean> {
  // If no user email prefix bucket is defined, or it matches the standard bucket ID, it's already there
  if (!bucketId || bucketId === BUCKET_ID) {
    return true;
  }

  const endpoint = import.meta.env.VITE_APPWRITE_STORAGE_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = import.meta.env.VITE_APPWRITE_STORAGE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
  const apiKey = import.meta.env.VITE_APPWRITE_STORAGE_API_KEY || import.meta.env.VITE_APPWRITE_API_KEY || 'standard_7719a87bdcc7f6e54a818da0d5bbd3bad9df92896693431e7898956699bfa37597b53d9c3663c44b6cee3d630ae3ce93a2663b37656281b7dc4d3219e8a05ef236b416c80e41ed29bb766e7b97c94058baea0ffd6fea0a368776ab9545a6421dc1db157459c97f6434bbc2ece2969cc32a85f373429556c8b17285be6234032c';

  if (!projectId) {
    console.warn("[Appwrite Bucket Creator] Project ID unspecified. Skipping dynamic creation.");
    return false;
  }

  try {
    console.log(`[Appwrite Bucket Creator] Checking/Creating bucket: ${bucketId} (${bucketName})`);
    
    // Attempt to make a creation call using administrative API Key or standard client headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    };

    if (apiKey) {
      headers['X-Appwrite-Key'] = apiKey;
    }

    try {
      // Try with modern Appwrite role-based permissions (v1.x Cloud format)
      await axios.post(`${endpoint}/storage/buckets`, {
        bucketId: bucketId,
        name: bucketName,
        permissions: ["read(\"any\")", "create(\"any\")", "update(\"any\")", "delete(\"any\")"],
        fileSecurity: false,
      }, { headers });
    } catch (tryErr: any) {
      const msg = tryErr?.response?.data?.message || tryErr?.message || '';
      const status = tryErr?.response?.status;
      if (status === 409 || msg.includes('already exists') || msg.includes('exist')) {
        return true;
      }
      console.warn(`[Appwrite Bucket Creator] Preferred role permissions failed, retrying with wildcard 'any'...`, msg);
      // Retrying with simple "any" format
      await axios.post(`${endpoint}/storage/buckets`, {
        bucketId: bucketId,
        name: bucketName,
        permissions: ['any'],
        fileSecurity: false,
      }, { headers });
    }

    console.log(`[Appwrite Bucket Creator] Bucket '${bucketName}' (${bucketId}) successfully registered/created! 💖`);
    return true;
  } catch (err: any) {
    const status = err?.response?.status;
    const message = err?.response?.data?.message || err?.message || '';
    if (status === 409 || message.includes('already exists') || message.includes('exist')) {
      console.log(`[Appwrite Bucket Creator] Bucket '${bucketId}' already exists.`);
      return true;
    }
    console.warn(`[Appwrite Bucket Creator] Unable to dynamically create bucket '${bucketId}': ${message}. (Status: ${status}). Falling back gracefully.`);
    return false;
  }
}

export { Query, ID };
