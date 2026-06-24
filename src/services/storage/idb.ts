import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface NotesDB extends DBSchema {
  handles: {
    key: string;
    value: {
      key: string;
      handle: FileSystemDirectoryHandle;
      timestamp: number;
    };
  };
  preferences: {
    key: string;
    value: unknown;
  };
}

let db: IDBPDatabase<NotesDB> | null = null;

async function getDB(): Promise<IDBPDatabase<NotesDB>> {
  if (db) return db;
  db = await openDB<NotesDB>("slate", 1, {
    upgrade(database) {
      database.createObjectStore("handles", { keyPath: "key" });
      database.createObjectStore("preferences", { keyPath: "key" as never });
    },
  });
  return db;
}

export async function saveRootHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const database = await getDB();
  await database.put("handles", { key: "root", handle, timestamp: Date.now() });
}

export async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const database = await getDB();
    const record = await database.get("handles", "root");
    return record?.handle ?? null;
  } catch {
    return null;
  }
}

export async function clearRootHandle(): Promise<void> {
  const database = await getDB();
  await database.delete("handles", "root");
}

export async function savePreference<T>(key: string, value: T): Promise<void> {
  const database = await getDB();
  await database.put("preferences", { key, value } as never);
}

export async function loadPreference<T>(key: string): Promise<T | null> {
  try {
    const database = await getDB();
    const record = await database.get("preferences", key as never);
    return (record as { key: string; value: T } | undefined)?.value ?? null;
  } catch {
    return null;
  }
}
