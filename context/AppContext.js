import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase, getCurrentUser } from '../services/supabase';
import { useWatchlist } from '../hooks/useWatchlist';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // ── Watchlist (shared across all tabs) ────────
  const watchlistHook = useWatchlist(user);

  // ── Auth ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Location ──────────────────────────────────
  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Results may not be location-specific.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (err) {
      setLocationError('Could not retrieve location.');
      console.warn('[Location]', err.message);
    }
  }, []);

  const value = {
    // Auth
    user,
    session,
    loadingAuth,

    // Location
    location,
    locationError,
    requestLocation,

    // Search
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,

    // Watchlist
    watchlist: watchlistHook.watchlist,
    watchlistLoading: watchlistHook.loading,
    addItem: watchlistHook.addItem,
    removeItem: watchlistHook.removeItem,
    isInWatchlist: watchlistHook.isInWatchlist,
    reloadWatchlist: watchlistHook.reload,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
