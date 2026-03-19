import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../services/supabase';

const LOCAL_KEY = 'swipemart_watchlist';

/**
 * Manages the user's watchlist.
 * - If a user is logged in, syncs with Supabase.
 * - Otherwise falls back to AsyncStorage (guest mode).
 */
export function useWatchlist(user) {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Load ──────────────────────────────────────
  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await getWatchlist(user.id);
        if (!error && data) {
          setWatchlist(data.map((row) => row.product_data));
        }
      } else {
        const raw = await AsyncStorage.getItem(LOCAL_KEY);
        setWatchlist(raw ? JSON.parse(raw) : []);
      }
    } catch (err) {
      console.error('[useWatchlist] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  // ── Add ───────────────────────────────────────
  const addItem = useCallback(async (product) => {
    setWatchlist((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [product, ...prev];
    });

    if (user) {
      await addToWatchlist(user.id, product);
    } else {
      const current = await AsyncStorage.getItem(LOCAL_KEY);
      const parsed = current ? JSON.parse(current) : [];
      const updated = [product, ...parsed.filter((p) => p.id !== product.id)];
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    }
  }, [user]);

  // ── Remove ────────────────────────────────────
  const removeItem = useCallback(async (productId) => {
    setWatchlist((prev) => prev.filter((p) => p.id !== productId));

    if (user) {
      await removeFromWatchlist(user.id, productId);
    } else {
      const current = await AsyncStorage.getItem(LOCAL_KEY);
      const parsed = current ? JSON.parse(current) : [];
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(parsed.filter((p) => p.id !== productId)));
    }
  }, [user]);

  const isInWatchlist = useCallback(
    (productId) => watchlist.some((p) => p.id === productId),
    [watchlist]
  );

  return { watchlist, loading, addItem, removeItem, isInWatchlist, reload: loadWatchlist };
}
