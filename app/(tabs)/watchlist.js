import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { ProductDetailModal } from '../../components/ProductCard';
import Colors from '../../constants/colors';

export default function WatchlistScreen() {
  const { user, watchlist, watchlistLoading: loading, removeItem, reloadWatchlist: reload } = useApp();
  const [removingId, setRemovingId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleRemove = async (product) => {
    setRemovingId(product.id);
    setDetailVisible(false);
    await removeItem(product.id);
    setRemovingId(null);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.7}
        onPress={() => { setSelectedProduct(item); setDetailVisible(true); }}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.category}>{item.category?.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.row}>
            <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
            {item.rating > 0 && (
              <Text style={styles.rating}>★ {item.rating?.toFixed(1)}</Text>
            )}
          </View>
          <Text style={styles.source}>{item.source}</Text>
        </View>
      </TouchableOpacity>

      {removingId === item.id ? (
        <ActivityIndicator style={styles.removeBtn} size="small" color={Colors.nope} />
      ) : (
        <Pressable style={styles.removeBtn} onPress={() => handleRemove(item)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title2}>Watchlist</Text>
        <Text style={styles.subtitle}>{watchlist.length} item{watchlist.length !== 1 ? 's' : ''} saved</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : watchlist.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptyText}>
            Swipe right on products you love to save them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={reload}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Product detail modal */}
      <ProductDetailModal
        product={selectedProduct}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onRemove={selectedProduct ? () => handleRemove(selectedProduct) : undefined}
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  title2: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumb: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  rating: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  source: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  removeBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nopeLight,
  },
  removeBtnText: {
    fontSize: 16,
    color: Colors.nope,
    fontWeight: '700',
  },
  separator: {
    height: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
