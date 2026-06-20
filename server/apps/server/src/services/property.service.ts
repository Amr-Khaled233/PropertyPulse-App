// Property service — business logic around property listings.

import { propertyRepository, type PropertyFilters } from '../repositories/property.repository.js';
import { ApiError } from '../utils/apiError.js';
import type { Property, Paginated } from '@propertypulse/shared-types';

// --- On-demand EN→AR translation of listing text -----------------------------
// Uses the FREE MyMemory API (no key, no Gemini quota), chunked by sentence to
// respect the ~500-char limit, cached in memory, and falls back to the original
// English on any error or timeout.
const translationCache = new Map<string, { title: string; description: string }>();
const MAX_CHUNK = 450;

async function translateChunk(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const j = (await res.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
    const out = j?.responseData?.translatedText;
    if (j?.responseStatus !== 200 || !out || /QUERY LENGTH|INVALID|PLEASE SELECT/i.test(out)) {
      throw new Error('translate failed');
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

async function translateText(text: string): Promise<string> {
  if (!text.trim()) return text;
  const sentences = text.split(/(?<=[.!?؟])\s+/);
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + ' ' + s).trim().length > MAX_CHUNK) {
      if (buf) chunks.push(buf.trim());
      buf = s.length > MAX_CHUNK ? s.slice(0, MAX_CHUNK) : s;
    } else {
      buf = `${buf} ${s}`;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return (await Promise.all(chunks.map(translateChunk))).join(' ');
}

async function localizeProperty(property: Property, lang?: 'en' | 'ar'): Promise<Property> {
  if (lang !== 'ar') return property;
  const key = `${property.id}:ar`;
  const cached = translationCache.get(key);
  if (cached) return { ...property, ...cached };
  try {
    const [title, description] = await Promise.all([
      translateText(property.title),
      translateText(property.description ?? ''),
    ]);
    translationCache.set(key, { title, description });
    return { ...property, title, description };
  } catch {
    // Cache the original so we don't retry a failing translation on every request.
    translationCache.set(key, { title: property.title, description: property.description ?? '' });
    return property;
  }
}

export const propertyService = {
  search(filters: PropertyFilters): Promise<Paginated<Property>> {
    return propertyRepository.search(filters);
  },

  listTowns(city?: string): Promise<string[]> {
    return propertyRepository.listTowns(city);
  },

  async getById(id: string, lang?: 'en' | 'ar'): Promise<Property> {
    const property = await propertyRepository.getById(id);
    if (!property) throw ApiError.notFound('Property not found');
    return localizeProperty(property, lang);
  },

  create(input: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    return propertyRepository.create(input);
  },
};
