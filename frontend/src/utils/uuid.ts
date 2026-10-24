/**
 * Client-side UUID generator and id-ensuring utilities.
 * Conforms to RFC 4122 v4 UUID format matching backend Pydantic schemas.
 */

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Idempotently ensures an object has a valid UUID id.
 * If item.id already exists and is non-empty, returns the item unchanged.
 * If missing or empty, mints a fresh v4 UUID without mutating the original object.
 */
export function ensureId<T extends Record<string, any>>(item: T): T & { id: string } {
  if (item && 'id' in item && typeof (item as any).id === 'string' && (item as any).id.trim() !== '') {
    return item as T & { id: string };
  }
  return {
    ...item,
    id: generateUUID(),
  };
}
