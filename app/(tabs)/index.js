import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
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

  const { products, loading, error, loadMore, refresh } = useProducts(searchQuery, location);
  const { addItem } = useWatchlist(user);

  // Request location on first mount
  useEffect(() => {
    requestLocation();
    // Show search modal on first open so users can set a query
    if (!searchQuery) setSearchVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwipeRight = useCallback(async (product) => {
    setSavedCount((c) => c + 1);
    try {
      await addItem(product);
    } catch (err) {
      console.warn('[Discover] watchlist error:', err.message);
    }
  }, [addItem]);

  const handleSwipeLeft = useCallback((product) => {
    setSkipCount((c) => c + 1);
  }, []);

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
        <View>
          <Text style={styles.appName}>SwipeMart</Text>
          {searchQuery ? (
            <Text style={styles.searchHint} numberOfLines={1}>"{searchQuery}"</Text>
          ) : (
            <Text style={styles.searchHint}>Browsing all items</Text>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => setSearchVisible(true)}>
          <Text style={styles.searchBtnText}>🔎 Search</Text>
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
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Loaded</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{skipCount}</Text>
          <Text style={styles.statLabel}>Skipped</Text>
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
            data={products}
            renderCard={renderCard}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onEndReached={loadMore}
            renderEmpty={renderEmpty}
          />
        )}
      </View>

      {/* Bottom action buttons (for tap-to-swipe) */}
      {products.length > 0 && !loading && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSkip]}
            onPress={() => {
              // handled via renderCard forceSwipe — show visual hint
              Alert.alert('Tip', 'Drag the card left to skip, or right to save!');
            }}
          >
            <Text style={styles.actionBtnLabel}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSave]}
            onPress={() => {
              Alert.alert('Tip', 'Drag the card right to save it to your watchlist!');
            }}
          >
            <Text style={styles.actionBtnLabel}>♥</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  searchHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  searchBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
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
  actionBtnSave: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.like,
  },
  actionBtnLabel: {
    fontSize: 22,
  },
});
