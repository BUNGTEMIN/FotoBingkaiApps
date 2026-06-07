import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { 
  getDatabase, 
  ref as rtdbRef, 
  get as rtdbGet, 
  set as rtdbSet, 
  push as rtdbPush, 
  remove as rtdbRemove, 
  update as rtdbUpdate, 
  onValue as rtdbOnValue, 
  serverTimestamp as rtdbServerTimestamp 
} from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const fbStorage = getStorage(app);

// Determine the URL of the Realtime Database dynamically with region fallback
let dbInstance;
try {
  const projectId = (firebaseConfig as any).projectId;
  const potentialUrls = [
    (firebaseConfig as any).databaseURL,
    `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app`,
    `https://${projectId}-default-rtdb.firebaseio.com`,
    `https://${projectId}.firebaseio.com`
  ].filter(Boolean);

  let success = false;
  for (const url of potentialUrls) {
    try {
      dbInstance = getDatabase(app, url);
      success = true;
      break;
    } catch (e) {
      // ignore
    }
  }
  if (!success) {
    dbInstance = getDatabase(app);
  }
} catch (err) {
  dbInstance = getDatabase(app);
}
export const db = dbInstance;

// Compatibility Layer to emulate Firestore on top of Realtime Database

export class FirestoreCompatRef {
  type: 'collection' | 'doc';
  path: string;
  db: any;
  constructor(type: 'collection' | 'doc', path: string, db: any) {
    this.type = type;
    this.path = path;
    this.db = db;
  }
}

export class FirestoreCompatQuery {
  ref: FirestoreCompatRef;
  wheres: Array<{ field: string; operator: string; value: any }> = [];
  orderBys: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
  constructor(ref: FirestoreCompatRef) {
    this.ref = ref;
  }
}

export class FirestoreCompatDocSnap {
  id: string;
  _data: any;
  exists(): boolean {
    return this._data !== null && this._data !== undefined;
  }
  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
  }
  data() {
    return this._data;
  }
}

export class FirestoreCompatQuerySnapshot {
  docs: FirestoreCompatDocSnap[];
  constructor(docs: FirestoreCompatDocSnap[]) {
    this.docs = docs;
  }
  forEach(callback: (doc: FirestoreCompatDocSnap) => void) {
    this.docs.forEach(callback);
  }
}

export class FirestoreCompatIncrement {
  val: number;
  constructor(val: number) {
    this.val = val;
  }
}

export function collection(database: any, path: string) {
  return new FirestoreCompatRef('collection', path, database);
}

export function doc(database: any, path: string, id?: string) {
  const fullPath = id ? `${path}/${id}` : path;
  return new FirestoreCompatRef('doc', fullPath, database);
}

export function query(refObj: FirestoreCompatRef, ...constraints: any[]) {
  const q = new FirestoreCompatQuery(refObj);
  for (const c of constraints) {
    if (c && c.type === 'where') {
      q.wheres.push(c);
    } else if (c && c.type === 'orderBy') {
      q.orderBys.push(c);
    }
  }
  return q;
}

export function where(field: string, operator: string, value: any) {
  return { type: 'where', field, operator, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function increment(val: number) {
  return new FirestoreCompatIncrement(val);
}

export function serverTimestamp() {
  return rtdbServerTimestamp();
}

function cleanDataForRTDB(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj === 'function') return null;
  if (typeof obj !== 'object') return obj;
  
  if (obj && typeof obj === 'object') {
    if (obj['.sv'] === 'timestamp') {
      return obj;
    }
    if (typeof obj.toDate === 'function') {
      const dVal = obj.toDate();
      return dVal instanceof Date ? dVal.getTime() : Date.now();
    }
    // Convert dates
    if (obj instanceof Date) {
      return obj.getTime();
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanDataForRTDB).filter((v: any) => v !== null);
  }

  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined && typeof value !== 'function') {
      cleaned[key] = cleanDataForRTDB(value);
    }
  }
  return cleaned;
}

function cleanDataFromRTDB(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  const res: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      res[key] = cleanDataFromRTDB(val);
    } else if (
      (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt' || key === 'downloadedAt')
    ) {
      if (typeof val === 'number') {
        res[key] = {
          seconds: Math.floor(val / 1000),
          nanoseconds: (val % 1000) * 1000000,
          toDate: () => new Date(val),
          toString: () => new Date(val).toString(),
          toLocaleString: () => new Date(val).toLocaleString()
        };
      } else if (typeof val === 'string') {
        const parsedMs = Date.parse(val);
        const validMs = !isNaN(parsedMs) ? parsedMs : Date.now();
        res[key] = {
          seconds: Math.floor(validMs / 1000),
          nanoseconds: (validMs % 1000) * 1000000,
          toDate: () => new Date(validMs),
          toString: () => val,
          toLocaleString: () => new Date(validMs).toLocaleString()
        };
      } else {
        res[key] = val;
      }
    } else {
      res[key] = val;
    }
  }
  return res;
}

export async function getDocs(target: FirestoreCompatRef | FirestoreCompatQuery) {
  const isQuery = target instanceof FirestoreCompatQuery;
  const refObj = isQuery ? target.ref : target;
  const rtdbPath = refObj.path;

  const snapshot = await rtdbGet(rtdbRef(db, rtdbPath));
  const docs: FirestoreCompatDocSnap[] = [];

  if (snapshot.exists()) {
    const val = snapshot.val();
    if (val && typeof val === 'object') {
      for (const key of Object.keys(val)) {
        const docData = val[key];
        const itemData = cleanDataFromRTDB(typeof docData === 'object' && docData !== null ? docData : { value: docData });

        let matches = true;
        if (isQuery) {
          for (const w of target.wheres) {
            const fieldValue = itemData[w.field];
            if (w.operator === '==') {
              if (fieldValue !== w.value) {
                matches = false;
                break;
              }
            }
          }
        }

        if (matches) {
          docs.push(new FirestoreCompatDocSnap(key, itemData));
        }
      }
    }
  }

  // Sort docs
  if (isQuery && target.orderBys.length > 0) {
    const ob = target.orderBys[0];
    docs.sort((a, b) => {
      const valA = a.data()[ob.field];
      const valB = b.data()[ob.field];
      if (valA === undefined || valA === null) return ob.direction === 'desc' ? 1 : -1;
      if (valB === undefined || valB === null) return ob.direction === 'desc' ? -1 : 1;
      if (valA < valB) return ob.direction === 'desc' ? 1 : -1;
      if (valA > valB) return ob.direction === 'desc' ? -1 : 1;
      return 0;
    });
  } else {
    docs.sort((a, b) => b.id.localeCompare(a.id));
  }

  return new FirestoreCompatQuerySnapshot(docs);
}

export function onSnapshot(
  target: FirestoreCompatRef | FirestoreCompatQuery | any,
  callback: (snapshot: any) => void,
  errorCallback?: (error: any) => void
) {
  const isQuery = target instanceof FirestoreCompatQuery;
  const refObj = isQuery ? target.ref : target;
  const rtdbPath = refObj?.path || '';

  if (!rtdbPath) return () => {};

  const parts = rtdbPath.split('/').filter(Boolean);
  const isDocument = parts.length % 2 === 0;
  const rtdbReference = rtdbRef(db, rtdbPath);

  if (isDocument) {
    return rtdbOnValue(rtdbReference, (snapshot) => {
      const val = snapshot.exists() ? cleanDataFromRTDB(snapshot.val()) : null;
      callback(new FirestoreCompatDocSnap(parts[parts.length - 1], val));
    }, (err) => {
      if (errorCallback) errorCallback(err);
    });
  } else {
    return rtdbOnValue(rtdbReference, (snapshot) => {
      const docs: FirestoreCompatDocSnap[] = [];
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          for (const key of Object.keys(val)) {
            const docData = val[key];
            const itemData = cleanDataFromRTDB(typeof docData === 'object' && docData !== null ? docData : { value: docData });

            let matches = true;
            if (isQuery) {
              for (const w of target.wheres) {
                const fieldValue = itemData[w.field];
                if (w.operator === '==') {
                  if (fieldValue !== w.value) {
                    matches = false;
                    break;
                  }
                }
              }
            }
            if (matches) {
              docs.push(new FirestoreCompatDocSnap(key, itemData));
            }
          }
        }
      }

      if (isQuery && target.orderBys.length > 0) {
        const ob = target.orderBys[0];
        docs.sort((a, b) => {
          const valA = a.data()[ob.field];
          const valB = b.data()[ob.field];
          if (valA === undefined || valA === null) return ob.direction === 'desc' ? 1 : -1;
          if (valB === undefined || valB === null) return ob.direction === 'desc' ? -1 : 1;
          if (valA < valB) return ob.direction === 'desc' ? 1 : -1;
          if (valA > valB) return ob.direction === 'desc' ? -1 : 1;
          return 0;
        });
      } else {
        docs.sort((a, b) => b.id.localeCompare(a.id));
      }

      callback(new FirestoreCompatQuerySnapshot(docs));
    }, (err) => {
      if (errorCallback) errorCallback(err);
    });
  }
}

export async function addDoc(refObj: FirestoreCompatRef, data: any) {
  const rtdbReference = rtdbRef(db, refObj.path);
  const newRef = rtdbPush(rtdbReference);
  const cleaned = cleanDataForRTDB(data);
  await rtdbSet(newRef, cleaned);
  return { id: newRef.key || '' };
}

export async function setDoc(refObj: FirestoreCompatRef, data: any) {
  const rtdbReference = rtdbRef(db, refObj.path);
  const cleaned = cleanDataForRTDB(data);
  await rtdbSet(rtdbReference, cleaned);
}

export async function deleteDoc(refObj: FirestoreCompatRef) {
  const rtdbReference = rtdbRef(db, refObj.path);
  await rtdbRemove(rtdbReference);
}

export async function updateDoc(refObj: FirestoreCompatRef, data: any) {
  const rtdbReference = rtdbRef(db, refObj.path);

  let hasIncrement = false;
  for (const k of Object.keys(data)) {
    if (data[k] instanceof FirestoreCompatIncrement) {
      hasIncrement = true;
      break;
    }
  }

  if (hasIncrement) {
    const snap = await rtdbGet(rtdbReference);
    const currentVal = snap.exists() ? snap.val() : {};
    const updated = { ...currentVal };
    for (const k of Object.keys(data)) {
      const val = data[k];
      if (val instanceof FirestoreCompatIncrement) {
        updated[k] = (Number(currentVal[k]) || 0) + val.val;
      } else {
        updated[k] = val;
      }
    }
    await rtdbSet(rtdbReference, cleanDataForRTDB(updated));
  } else {
    const cleaned = cleanDataForRTDB(data);
    await rtdbUpdate(rtdbReference, cleaned);
  }
}

// Error Hanlers mimicking original firestore signatures

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Realtime Database Error Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
