"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { BrandProfile, GeneratedPost } from "./types";
import { DEFAULT_BRAND, POSTS_KEY, STORAGE_KEY } from "./defaults";

interface BrandContextValue {
  brand: BrandProfile;
  posts: GeneratedPost[];
  ready: boolean;
  updateBrand: (patch: Partial<BrandProfile>) => void;
  resetBrand: () => void;
  addPost: (post: GeneratedPost) => void;
  removePost: (id: string) => void;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandProfile>(DEFAULT_BRAND);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage (external store) on mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const rawBrand = localStorage.getItem(STORAGE_KEY);
      if (rawBrand) {
        setBrand({ ...DEFAULT_BRAND, ...JSON.parse(rawBrand) });
      }
      const rawPosts = localStorage.getItem(POSTS_KEY);
      if (rawPosts) {
        setPosts(JSON.parse(rawPosts));
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const updateBrand = useCallback((patch: Partial<BrandProfile>) => {
    setBrand((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const resetBrand = useCallback(() => {
    setBrand(DEFAULT_BRAND);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const addPost = useCallback((post: GeneratedPost) => {
    setPosts((prev) => {
      const next = [post, ...prev].slice(0, 50);
      try {
        localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const removePost = useCallback((id: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(POSTS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <BrandContext.Provider
      value={{
        brand,
        posts,
        ready,
        updateBrand,
        resetBrand,
        addPost,
        removePost,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return ctx;
}
