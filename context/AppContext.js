import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { supabase, getCurrentUser, getProfile, upsertProfile } from '../services/supabase';
import { useWatchlist } from '../hooks/useWatchlist';

const PREFS_KEY = 'swipemart_prefs';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // ── Preferences ─────────────────────────────────
  const [showActionButtons, setShowActionButtons] = useState(true);

  // Load preferences when user is known
  useEffect(() => {
    async function loadPrefs() {
      try {
        if (user) {
          const { data } = await getProfile(user.id);
          if (data?.preferences) {
            const prefs = data.preferences;
            if (typeof prefs.showActionButtons === 'boolean') {
              setShowActionButtons(prefs.showActionButtons);
            }
          }
        } else {
          const raw = await AsyncStorage.getItem(PREFS_KEY);
          if (raw) {
            const prefs = JSON.parse(raw);
            if (typeof prefs.showActionButtons === 'boolean') {
              setShowActionButtons(prefs.showActionButtons);
            }
          }
        }
      } catch (e) {
        console.warn('[Prefs] load error', e);
      }
    }
    loadPrefs();
  }, [user]);

  const saveShowActionButtons = useCallback(async (val) => {
    setShowActionButtons(val);
    try {
      if (user) {
        // Merge with any existing preferences
        const { data: existing } = await getProfile(user.id);
        const merged = { ...(existing?.preferences ?? {}), showActionButtons: val };
        await upsertProfile(user.id, { preferences: merged });
      } else {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        const current = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, showActionButtons: val }));
      }
    } catch (e) {
      console.warn('[Prefs] save error', e);
    }
  }, [user]);

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

    // Preferences
    showActionButtons,
    saveShowActionButtons,

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
