// Reactive CMS-driven store for homepage content
// Fetches from backend API with localStorage cache for fast initial render

const STORAGE_KEY = 'seventrip_homepage_cms';

export interface HomepageContent {
  hero: {
    badge: string;
    heading: string;
    headingHighlight: string;
    subtitle: string;
    videoUrl: string;
    posterUrl: string;
    overlayOpacity: number;
  };
  stats: { id: string; value: string; suffix: string; label: string; visible: boolean }[];
  features: { id: string; title: string; desc: string; icon: string; visible: boolean }[];
  offers: { id: string; title: string; discount: string; desc: string; gradient: string; emoji: string; visible: boolean }[];
  destinations: { id: string; name: string; hotels: string; img: string; category: string; visible: boolean }[];
  intlDestinations: { id: string; name: string; hotels: string; img: string; category: string; visible: boolean }[];
  airlines: { id: string; name: string; code: string; visible: boolean }[];
  hotels: { id: string; name: string; location: string; rating: string; reviews: string; price: string; img: string; visible: boolean }[];
  packages: { id: string; name: string; days: string; price: string; rating: string; reviews: string; img: string; visible: boolean }[];
  routes: { id: string; from: string; fromCode: string; to: string; toCode: string; price: string; visible: boolean }[];
  testimonials: { id: string; name: string; role: string; text: string; avatar: string; visible: boolean }[];
  sections: { key: string; label: string; visible: boolean; order: number }[];
}

// Empty content for when API hasn't loaded yet
const EMPTY_CONTENT: HomepageContent = {
  hero: {
    badge: "",
    heading: "",
    headingHighlight: "",
    subtitle: "",
    videoUrl: "/videos/hero-beach.mp4",
    posterUrl: "/images/hero-beach.jpg",
    overlayOpacity: 30,
  },
  stats: [],
  features: [],
  offers: [],
  destinations: [],
  intlDestinations: [],
  airlines: [],
  hotels: [],
  packages: [],
  routes: [],
  testimonials: [],
  sections: [],
};

// Subscribers for reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

let cachedContent: HomepageContent | null = null;
let apiFetched = false;

function loadFromCache(): HomepageContent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return EMPTY_CONTENT;
}

export function getHomepageContent(): HomepageContent {
  if (cachedContent) return cachedContent;
  cachedContent = loadFromCache();
  
  // Fetch fresh data from API (non-blocking)
  if (!apiFetched) {
    apiFetched = true;
    import('@/lib/api').then(({ api }) => {
      api.get<HomepageContent>('/cms/homepage').then(data => {
        if (data && typeof data === 'object') {
          cachedContent = { ...EMPTY_CONTENT, ...data };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedContent)); } catch {}
          listeners.forEach(fn => fn());
        }
      }).catch(() => { /* API unavailable, use cache */ });
    });
  }
  
  return cachedContent;
}

export function setHomepageContent(content: HomepageContent) {
  cachedContent = content;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch { /* ignore */ }
  
  // Persist to API
  import('@/lib/api').then(({ api }) => {
    api.put('/cms/homepage', content).catch(() => { /* API unavailable */ });
  });
  
  listeners.forEach(fn => fn());
}

export function subscribeHomepage(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// React hook
import { useSyncExternalStore } from 'react';

export function useHomepageContent(): HomepageContent {
  return useSyncExternalStore(
    subscribeHomepage,
    getHomepageContent,
    getHomepageContent
  );
}
