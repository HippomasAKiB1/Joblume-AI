/**
 * Utilities for section ordering and keyboard reordering
 */

export function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
    return list;
  }
  const result = Array.from(list);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

export function moveItemUp<T>(list: T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return list;
  return reorderArray(list, index, index - 1);
}

export function moveItemDown<T>(list: T[], index: number): T[] {
  if (index < 0 || index >= list.length - 1) return list;
  return reorderArray(list, index, index + 1);
}
