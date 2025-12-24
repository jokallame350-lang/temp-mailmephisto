import { openDB, IDBPDatabase } from 'idb';
import { EmailSummary } from '../types';

const DB_NAME = 'MephistoDB';
const STORE_NAME = 'emails';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

export const saveEmailsToDB = async (emails: EmailSummary[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const email of emails) {
    await tx.store.put(email);
  }
  await tx.done;
};

export const getEmailsFromDB = async (): Promise<EmailSummary[]> => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const clearDB = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};