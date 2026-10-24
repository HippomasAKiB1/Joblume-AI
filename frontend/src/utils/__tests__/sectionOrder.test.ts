import { describe, it, expect } from 'vitest';
import { reorderArray, moveItemUp, moveItemDown } from '../sectionOrder';

describe('Section Order Utilities', () => {
  const initialSections = ['summary', 'experience', 'education', 'skills'];

  it('reorderArray correctly moves item from one index to another', () => {
    // Move 'skills' (index 3) to the top (index 0)
    const result = reorderArray(initialSections, 3, 0);
    expect(result).toEqual(['skills', 'summary', 'experience', 'education']);
  });

  it('moveItemUp shifts item one position backwards', () => {
    // Move 'education' (index 2) up -> should become index 1
    const result = moveItemUp(initialSections, 2);
    expect(result).toEqual(['summary', 'education', 'experience', 'skills']);
  });

  it('moveItemUp on index 0 is a no-op', () => {
    const result = moveItemUp(initialSections, 0);
    expect(result).toEqual(initialSections);
  });

  it('moveItemDown shifts item one position forwards', () => {
    // Move 'summary' (index 0) down -> should become index 1
    const result = moveItemDown(initialSections, 0);
    expect(result).toEqual(['experience', 'summary', 'education', 'skills']);
  });

  it('moveItemDown on last index is a no-op', () => {
    const result = moveItemDown(initialSections, initialSections.length - 1);
    expect(result).toEqual(initialSections);
  });
});
