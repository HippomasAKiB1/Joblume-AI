import { describe, it, expect } from 'vitest';
import { normalizeBullets, normalizeList, normalizeSkills, parseTags } from '../normalize';

describe('Normalize Utilities', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  describe('normalizeBullets', () => {
    it('converts legacy string bullets to v2 objects with minted UUID and empty tags', () => {
      const input = [
        'Built full-stack microservices in Go and Python.',
        'Scaled Postgres database to 50k QPS.',
      ];
      const result = normalizeBullets(input);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Built full-stack microservices in Go and Python.');
      expect(result[0].tags).toEqual([]);
      expect(result[0].id).toMatch(UUID_V4_REGEX);

      expect(result[1].text).toBe('Scaled Postgres database to 50k QPS.');
      expect(result[1].tags).toEqual([]);
      expect(result[1].id).toMatch(UUID_V4_REGEX);
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('preserves existing bullet objects with IDs and tags', () => {
      const existingId = 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6';
      const input = [
        { id: existingId, text: 'Architected event-driven pipelines.', tags: ['kafka', 'architecture'] },
      ];
      const result = normalizeBullets(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(existingId);
      expect(result[0].text).toBe('Architected event-driven pipelines.');
      expect(result[0].tags).toEqual(['kafka', 'architecture']);
    });

    it('handles null, undefined, empty arrays and empty strings gracefully', () => {
      expect(normalizeBullets(null)).toEqual([]);
      expect(normalizeBullets(undefined)).toEqual([]);
      expect(normalizeBullets([])).toEqual([]);
      expect(normalizeBullets(['   ', ''])).toEqual([]);
    });
  });

  describe('normalizeList', () => {
    it('preserves existing item IDs and mints fresh IDs for missing ones', () => {
      const fixedId = '987fcdeb-51a2-43d4-b567-890123456789';
      const input = [
        { id: fixedId, institution: 'Stanford University', degree: 'B.S. CS' },
        { institution: 'MIT', degree: 'M.S. EECS' },
      ];

      const result = normalizeList(input);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(fixedId);
      expect(result[1].id).toMatch(UUID_V4_REGEX);
      expect(result[1].institution).toBe('MIT');
    });

    it('handles null and undefined lists cleanly', () => {
      expect(normalizeList(null)).toEqual([]);
      expect(normalizeList(undefined)).toEqual([]);
    });
  });

  describe('normalizeSkills', () => {
    it('normalizes string skills to { name, tags: [] } and preserves skill objects', () => {
      const input = [
        'React',
        { name: 'Python', tags: ['backend', 'fastapi'] },
        '   ',
      ];
      const result = normalizeSkills(input);

      expect(result).toEqual([
        { name: 'React', tags: [] },
        { name: 'Python', tags: ['backend', 'fastapi'] },
      ]);
    });
  });

  describe('parseTags', () => {
    it('parses comma-separated string into clean unique lowercase tags', () => {
      expect(parseTags('React, TypeScript, react, Frontend,  backend ')).toEqual([
        'react',
        'typescript',
        'frontend',
        'backend',
      ]);
    });

    it('handles string array cleanly with deduplication', () => {
      expect(parseTags(['DevOps', 'AWS', 'devops', ' '])).toEqual(['devops', 'aws']);
    });
  });
});
