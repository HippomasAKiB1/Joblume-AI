import { generateUUID, ensureId } from './uuid';
import type { BulletItem, SkillItem } from '../types/v2';

/**
 * Normalizes bullet items from either legacy string format or v2 object format.
 * Guarantees every bullet has { id, text, tags: string[] }.
 */
export function normalizeBullets(bullets?: Array<string | Partial<BulletItem>> | null): BulletItem[] {
  if (!Array.isArray(bullets)) {
    return [];
  }

  return bullets
    .map((bullet) => {
      if (typeof bullet === 'string') {
        const text = bullet.trim();
        if (!text) return null;
        return {
          id: generateUUID(),
          text,
          tags: [],
        };
      }

      if (bullet && typeof bullet === 'object') {
        const text = typeof bullet.text === 'string' ? bullet.text : '';
        const id = bullet.id && bullet.id.trim() !== '' ? bullet.id : generateUUID();
        const tags = Array.isArray(bullet.tags)
          ? bullet.tags.map((t) => String(t).trim()).filter((t) => t.length > 0)
          : [];

        return {
          id,
          text,
          tags,
        };
      }

      return null;
    })
    .filter((b): b is BulletItem => b !== null);
}

/**
 * Normalizes a list of items with id property.
 * Guarantees every item has a non-empty UUID string id.
 */
export function normalizeList<T extends { id?: string }>(items?: T[] | null): Array<T & { id: string }> {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => ensureId(item));
}

/**
 * Normalizes skill items ensuring { name: string, tags: string[] }.
 */
export function normalizeSkills(skills?: Array<string | Partial<SkillItem>> | null): SkillItem[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  return skills
    .map((s) => {
      if (typeof s === 'string') {
        const name = s.trim();
        if (!name) return null;
        return { name, tags: [] };
      }
      if (s && typeof s === 'object') {
        const name = typeof s.name === 'string' ? s.name.trim() : '';
        if (!name) return null;
        const tags = Array.isArray(s.tags)
          ? s.tags.map((t) => String(t).trim()).filter((t) => t.length > 0)
          : [];
        return { name, tags };
      }
      return null;
    })
    .filter((s): s is SkillItem => s !== null);
}

/**
 * Normalizes comma-separated tag input or array into clean string array.
 */
export function parseTags(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((t) => t.trim().toLowerCase()).filter(Boolean)));
  }
  if (typeof input === 'string') {
    return Array.from(
      new Set(
        input
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }
  return [];
}
