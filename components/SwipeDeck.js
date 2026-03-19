import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
} from 'react-native';
import Colors from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DURATION = 220;
const ROTATION_RANGE = 15; // degrees
const CARDS_IN_VIEW = 3;

export default function SwipeDeck({
  data = [],
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onEndReached,
  renderEmpty,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef(null); // 'left' | 'right' | null

  // ── Swipe Out ────────────────────────────────
  const forceSwipe = useCallback(
    (direction) => {
      const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => onSwipeComplete(direction));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex]
  );

  const onSwipeComplete = useCallback(
    (direction) => {
      const item = data[currentIndex];
      direction === 'right' ? onSwipeRight?.(item) : onSwipeLeft?.(item);
      position.setValue({ x: 0, y: 0 });
      swipeDirection.current = null;
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= data.length - 2) onEndReached?.();
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, data]
  );

  const resetPosition = useCallback(() => {
    swipeDirection.current = null;
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [position]);

  // ── Pan Responder ────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        swipeDirection.current = gesture.dx > 0 ? 'right' : 'left';
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // ── Interpolated styles ───────────────────────
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [`-${ROTATION_RANGE}deg`, '0deg', `${ROTATION_RANGE}deg`],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.15],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.15, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const topCardStyle = {
    transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
  };

  // ── Render helpers ────────────────────────────
  const renderCards = () => {
    if (currentIndex >= data.length) {
      return renderEmpty ? renderEmpty() : <DefaultEmpty />;
    }

    return data
      .slice(currentIndex, currentIndex + CARDS_IN_VIEW)
      .map((item, i) => {
        const isTop = i === 0;

        if (isTop) {
          return (
            <Animated.View
              key={item.id}
              style={[styles.cardContainer, topCardStyle, { zIndex: 10 }]}
              {...panResponder.panHandlers}
            >
              {/* Like badge */}
              <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
                <Text style={[styles.badgeText, { color: Colors.like }]}>SAVE</Text>
              </Animated.View>

              {/* Nope badge */}
              <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
                <Text style={[styles.badgeText, { color: Colors.nope }]}>SKIP</Text>
              </Animated.View>

              {renderCard(item, { isTop: true, forceSwipe })}
            </Animated.View>
          );
        }

        // Background cards – scale up slightly as the top card moves away
        const scaleValue = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [1, 0.94 - i * 0.02, 1],
          extrapolate: 'clamp',
        });

        const translateY = position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: [-(i * 8), i * 8, -(i * 8)],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={item.id}
            style={[
              styles.cardContainer,
              {
                zIndex: 10 - i,
                transform: [{ scale: scaleValue }, { translateY }],
              },
            ]}
          >
            {renderCard(item, { isTop: false })}
          </Animated.View>
        );
      })
      .reverse(); // render back-cards first so top is on top
  };

  return (
    <View style={styles.container}>
      {renderCards()}
    </View>
  );
}

// ── Public helpers to call from outside ──────────
// You can get a ref to SwipeDeck and call swipeLeft() / swipeRight() via the
// forceSwipe prop passed into renderCard's second argument.

function DefaultEmpty() {
  return (
    <View style={styles.emptyWrapper}>
      <Text style={styles.emptyTitle}>You've seen everything!</Text>
      <Text style={styles.emptySubtitle}>Try a new search or pull to refresh.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    top: 0,
  },
  badge: {
    position: 'absolute',
    top: 24,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: Colors.like,
    transform: [{ rotate: '-15deg' }],
  },
  nopeBadge: {
    right: 20,
    borderColor: Colors.nope,
    transform: [{ rotate: '15deg' }],
  },
  badgeText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
