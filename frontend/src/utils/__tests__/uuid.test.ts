import { describe, it, expect } from 'vitest';
import { generateUUID, ensureId } from '../uuid';

describe('UUID Utilities', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('generateUUID produces valid RFC 4122 v4 format', () => {
    const id = generateUUID();
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('generateUUID produces unique identifiers across multiple calls', () => {
    const count = 50;
    const ids = new Set<string>();
    for (let i = 0; i < count; i++) {
      ids.add(generateUUID());
    }
    expect(ids.size).toBe(count);
  });

  it('ensureId is idempotent and preserves existing valid IDs', () => {
    const existingId = '123e4567-e89b-12d3-a456-426614174000';
    const item = { id: existingId, title: 'Software Engineer' };
    const result = ensureId(item);

    expect(result.id).toBe(existingId);
    expect(result.title).toBe('Software Engineer');
  });

  it('ensureId mints fresh v4 UUID when id is missing or empty', () => {
    const itemWithoutId = { title: 'Product Manager' };
    const result = ensureId(itemWithoutId);

    expect(result.id).toBeDefined();
    expect(result.id).toMatch(UUID_V4_REGEX);
    expect(result.title).toBe('Product Manager');

    const itemWithEmptyId = { id: '   ', name: 'TypeScript' };
    const resultEmpty = ensureId(itemWithEmptyId);
    expect(resultEmpty.id).toMatch(UUID_V4_REGEX);
  });
});
