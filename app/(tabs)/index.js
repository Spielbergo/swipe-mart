import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck from '../../components/SwipeDeck';
import ProductCard from '../../components/ProductCard';
import SearchModal from '../../components/SearchModal';
import { useProducts } from '../../hooks/useProducts';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useApp } from '../../context/AppContext';
import Colors from '../../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DiscoverScreen() {
  const { user, location, requestLocation, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useApp();
  const [searchVisible, setSearchVisible] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [maybeCount, setMaybeCount] = useState(0);
  const [requeuedItems, setRequeuedItems] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const deckRef = useRef();

  const { products, loading, error, loadMore, refresh } = useProducts(searchQuery, location, selectedCategory);
  const { addItem } = useWatchlist(user);

  // Request location on first mount
  useEffect(() => {
    requestLocation();
    // Show search modal on first open so users can set a query
    if (!searchQuery) setSearchVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((message) => {
    setToastContent(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity]);

  const showSavedToast = useCallback(() => showToast('♥ Saved!'), [showToast]);

  const handleSwipeRight = useCallback(async (product) => {
    setSavedCount((c) => c + 1);
    showSavedToast();
    try {
      await addItem(product);
    } catch (err) {
      console.warn('[Discover] watchlist error:', err.message);
    }
  }, [addItem, showSavedToast]);

  const handleSwipeLeft = useCallback((product) => {
    setSkipCount((c) => c + 1);
  }, []);

  const handleSwipeUp = useCallback((product) => {
    setMaybeCount((c) => c + 1);
    showToast('↩ Maybe!');
    // Re-append with a unique key so it reappears at the end of the deck
    setRequeuedItems((prev) => [...prev, { ...product, id: `${product.id}_r${Date.now()}` }]);
  }, [showToast]);

  const handleSearch = useCallback(({ query, category }) => {
    setSearchQuery(query);
    setSelectedCategory(category);
  }, [setSearchQuery, setSelectedCategory]);

  const renderCard = useCallback((item, { isTop, forceSwipe }) => (
    <ProductCard product={item} isTop={isTop} forceSwipe={forceSwipe} />
  ), []);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🛒</Text>
      <Text style={styles.emptyTitle}>No more items!</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No more results for "${searchQuery}".`
          : 'You\'ve browsed everything available.'}
      </Text>
      <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
        <Text style={styles.refreshBtnText}>Browse again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.newSearchBtn} onPress={() => setSearchVisible(true)}>
        <Text style={styles.newSearchBtnText}>New search</Text>
      </TouchableOpacity>
    </View>
  ), [searchQuery, refresh]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>SwipeMart</Text>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => setSearchVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.searchBarIcon}>🔎</Text>
          <Text
            style={[styles.searchBarText, !searchQuery && styles.searchBarPlaceholder]}
            numberOfLines={1}
          >
            {searchQuery || 'Search products…'}
          </Text>
          {searchQuery ? (
            <Text style={styles.searchBarEdit}>Edit</Text>
          ) : (
            <Text style={styles.searchBarEdit}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{savedCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{maybeCount}</Text>
          <Text style={styles.statLabel}>Maybe</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{skipCount}</Text>
          <Text style={styles.statLabel}>Skipped</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Loaded</Text>
        </View>
      </View>

      {/* Deck area */}
      <View style={styles.deckWrapper}>
        {loading && products.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding products near you…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={refresh}>
              <Text style={styles.refreshBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeDeck
            ref={deckRef}
            data={[...products, ...requeuedItems]}
            renderCard={renderCard}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onEndReached={loadMore}
            renderEmpty={renderEmpty}
          />
        )}
      </View>

      {/* Bottom action buttons */}
      {products.length > 0 && !loading && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSkip]}
            onPress={() => deckRef.current?.swipeLeft()}
          >
            <Text style={styles.actionBtnLabel}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnMaybe]}
            onPress={() => deckRef.current?.swipeUp()}
          >
            <Text style={styles.actionBtnLabel}>↩</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSave]}
            onPress={() => deckRef.current?.swipeRight()}
          >
            <Text style={styles.actionBtnLabel}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastContent}</Text>
        </Animated.View>
      )}

      {/* Search modal */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSearch={handleSearch}
        initialQuery={searchQuery}
        initialCategory={selectedCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
    // suppress browser focus ring on web
    outlineStyle: 'none',
  },
  searchBarIcon: {
    fontSize: 16,
  },
  searchBarText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  searchBarPlaceholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  searchBarEdit: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  deckWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorEmoji: { fontSize: 48 },
  errorText: {
    fontSize: 15,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  refreshBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  refreshBtnText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
  newSearchBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  newSearchBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnSkip: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.nope,
  },
  actionBtnMaybe: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.maybe,
  },
  actionBtnSave: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.like,
  },
  actionBtnLabel: {
    fontSize: 22,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 110,
    backgroundColor: Colors.like,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
