// localStorage-backed mutable store for demo data
// All CRUD operations persist across page reloads

type StoreKey = string;

function load<T>(key: StoreKey, fallback: T): T {
  try {
    const stored = localStorage.getItem(`st_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function save<T>(key: StoreKey, data: T) {
  localStorage.setItem(`st_${key}`, JSON.stringify(data));
}

// ========== Generic CRUD helpers ==========

export function getCollection<T extends { id: string }>(key: StoreKey, fallback: T[]): T[] {
  return load(key, fallback);
}

export function addToCollection<T extends { id: string }>(key: StoreKey, fallback: T[], item: T): T[] {
  const items = load(key, fallback);
  items.unshift(item);
  save(key, items);
  return items;
}

export function updateInCollection<T extends { id: string }>(key: StoreKey, fallback: T[], id: string, updates: Partial<T>): T[] {
  const items = load(key, fallback);
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) items[idx] = { ...items[idx], ...updates };
  save(key, items);
  return items;
}

export function removeFromCollection<T extends { id: string }>(key: StoreKey, fallback: T[], id: string): T[] {
  const items = load(key, fallback).filter(i => i.id !== id);
  save(key, items);
  return items;
}

// ========== Stats helpers ==========

export function getStats<T>(key: StoreKey, fallback: T): T {
  return load(key, fallback);
}

export function saveStats<T>(key: StoreKey, data: T) {
  save(key, data);
}
