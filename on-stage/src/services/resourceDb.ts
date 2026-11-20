// Minimal IndexedDB persistence for audio resources (the file blobs live in the browser).

export interface StoredResource {
  id: string
  name: string
  type: string
  size: number
  addedAt: number
  blob: Blob
}

const DB_NAME = 'on-stage'
const DB_VERSION = 1
const STORE = 'resources'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    // Ask the browser not to evict our files under storage pressure (best effort).
    navigator.storage?.persist?.().catch(() => {})
  }
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = op(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(request.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

export async function listResources(): Promise<StoredResource[]> {
  const all = await run<StoredResource[]>('readonly', (store) => store.getAll())
  return all.sort((a, b) => a.addedAt - b.addedAt)
}

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost); a phone hitting the
// dev server over LAN HTTP doesn't have it.
function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export async function addResource(file: File): Promise<StoredResource> {
  const resource: StoredResource = {
    id: newId(),
    name: file.name.replace(/\.[^.]+$/, ''),
    type: file.type,
    size: file.size,
    addedAt: Date.now(),
    blob: file,
  }
  await run('readwrite', (store) => store.add(resource))
  return resource
}

export async function removeResource(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}
