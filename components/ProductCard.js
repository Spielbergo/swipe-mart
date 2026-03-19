import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import Colors from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62;

export default function ProductCard({ product, isTop = false, forceSwipe }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  const discountedPrice = product.originalPrice
    ? product.price
    : null;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.97}
        style={[styles.card, !isTop && styles.cardBack]}
        onPress={() => isTop && setDetailVisible(true)}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={Colors.primary} />
          )}
          {!imageError ? (
            <Image
              source={{ uri: product.thumbnail }}
              style={styles.image}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => { setImageLoading(false); setImageError(true); }}
            />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>📦</Text>
            </View>
          )}

          {/* Source Tag */}
          <View style={styles.sourceTag}>
            <Text style={styles.sourceText}>{product.source}</Text>
          </View>

          {/* Discount badge */}
          {product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{Math.round(product.discountPercentage)}%</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.category}>{product.category?.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

          <View style={styles.row}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
            <View style={styles.spacer} />
            {product.rating > 0 && (
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {product.brand && product.brand !== product.category && (
            <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
          )}
        </View>

        {/* Action hint (only on top card) */}
        {isTop && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>← Skip  •  Tap for details  •  Save →</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Detail Modal */}
      <ProductDetailModal
        product={product}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onSave={() => { setDetailVisible(false); forceSwipe?.('right'); }}
        onSkip={() => { setDetailVisible(false); forceSwipe?.('left'); }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────

function ProductDetailModal({ product, visible, onClose, onSave, onSkip }) {
  if (!product) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        {/* Handle bar */}
        <View style={modal.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: product.images?.[0] ?? product.thumbnail }}
            style={modal.image}
            resizeMode="cover"
          />

          <View style={modal.body}>
            <Text style={modal.category}>{product.category?.toUpperCase()}</Text>
            <Text style={modal.title}>{product.title}</Text>

            <View style={modal.priceRow}>
              <Text style={modal.price}>${product.price.toFixed(2)}</Text>
              {product.originalPrice && product.originalPrice > product.price && (
                <Text style={modal.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
              )}
              {product.discountPercentage > 0 && (
                <View style={modal.discountChip}>
                  <Text style={modal.discountChipText}>
                    Save {Math.round(product.discountPercentage)}%
                  </Text>
                </View>
              )}
            </View>

            {product.rating > 0 && (
              <View style={modal.ratingRow}>
                <Text style={modal.star}>★</Text>
                <Text style={modal.ratingValue}>{product.rating.toFixed(1)}</Text>
                {product.reviewCount > 0 && (
                  <Text style={modal.reviewCount}>({product.reviewCount} reviews)</Text>
                )}
              </View>
            )}

            <Text style={modal.sectionLabel}>Description</Text>
            <Text style={modal.description}>{product.description}</Text>

            {product.tags?.length > 0 && (
              <View style={modal.tagsRow}>
                {product.tags.map((tag) => (
                  <View key={tag} style={modal.tag}>
                    <Text style={modal.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={modal.source}>Listed on {product.source}</Text>
          </View>
        </ScrollView>

        {/* CTA row */}
        <View style={modal.ctaRow}>
          <Pressable style={[modal.cta, modal.ctaSkip]} onPress={onSkip}>
            <Text style={modal.ctaSkipText}>✕  Skip</Text>
          </Pressable>
          <Pressable style={[modal.cta, modal.ctaSave]} onPress={onSave}>
            <Text style={modal.ctaSaveText}>♥  Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 32,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: Colors.card,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  cardBack: {
    opacity: 0.9,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border,
  },
  imageFallbackText: {
    fontSize: 64,
  },
  sourceTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.nope,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    padding: 14,
    gap: 4,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  spacer: { flex: 1 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: {
    color: Colors.warning,
    fontSize: 15,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  brand: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  hint: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  hintText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});

const modal = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.surface,
  },
  body: {
    padding: 20,
    gap: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountChip: {
    backgroundColor: Colors.nopeLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountChipText: {
    color: Colors.nope,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: { color: Colors.warning, fontSize: 18 },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  source: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cta: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSkip: {
    backgroundColor: Colors.nopeLight,
  },
  ctaSave: {
    backgroundColor: Colors.primary,
  },
  ctaSkipText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.nope,
  },
  ctaSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
