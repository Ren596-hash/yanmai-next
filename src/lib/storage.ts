// 研脉 · IndexedDB 持久层
// 所有用户数据（论文/PDF/批注/阅读日志/用户画像）的客户端存储

export interface StoredPaper {
  id?: number;
  title: string;
  authors: string;
  journal: string;
  doi: string;
  abstract: string;
  sections: string[][];
  tags: string[];
  created_at: string;
  source: "static" | "uploaded";
  pdfBlob?: ArrayBuffer;
}

export interface ReadingEntry {
  paper_id: number;
  section_id: string;
  action: string;
  dwell_seconds?: number;
  timestamp: number;
}

export interface UserProfile {
  interests: string[];
  skill: string;
  ratings: Record<string, number>;
  timeCommitment: number;
  careerDirection: string;
  updatedAt: string;
}

const DB_NAME = "yanmai_db";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("papers")) {
        const store = db.createObjectStore("papers", { keyPath: "id", autoIncrement: true });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("source", "source", { unique: false });
      }
      if (!db.objectStoreNames.contains("reading_log")) {
        const store = db.createObjectStore("reading_log", { keyPath: "id", autoIncrement: true });
        store.createIndex("paper_id", "paper_id", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains("user_profile")) {
        db.createObjectStore("user_profile", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Papers ---

export async function addPaper(paper: Omit<StoredPaper, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("papers", "readwrite");
    const store = tx.objectStore("papers");
    const req = store.add(paper);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllPapers(): Promise<StoredPaper[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("papers", "readonly");
    const store = tx.objectStore("papers");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPaperById(id: number): Promise<StoredPaper | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("papers", "readonly");
    const store = tx.objectStore("papers");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPaperPDF(id: number): Promise<ArrayBuffer | undefined> {
  const paper = await getPaperById(id);
  return paper?.pdfBlob;
}

export async function deletePaper(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("papers", "readwrite");
    const store = tx.objectStore("papers");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Reading Log ---

export async function addReadingEntry(entry: Omit<ReadingEntry, "id">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("reading_log", "readwrite");
    const store = tx.objectStore("reading_log");
    const req = store.add(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getReadingLog(): Promise<ReadingEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("reading_log", "readonly");
    const store = tx.objectStore("reading_log");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- User Profile ---

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("user_profile", "readwrite");
    const store = tx.objectStore("user_profile");
    const req = store.put({ ...profile, id: "default" });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadProfile(): Promise<UserProfile | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("user_profile", "readonly");
    const store = tx.objectStore("user_profile");
    const req = store.get("default");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- Settings ---

export async function getSetting(key: string): Promise<unknown> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const store = tx.objectStore("settings");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value);
    req.onerror = () => reject(req.error);
  });
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    const store = tx.objectStore("settings");
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
