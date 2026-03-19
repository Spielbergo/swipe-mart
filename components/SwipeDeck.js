import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
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
const SWIPE_UP_THRESHOLD = SCREEN_HEIGHT * 0.22;
const SWIPE_OUT_DURATION = 220;
const ROTATION_RANGE = 15;
const CARDS_IN_VIEW = 3;

const SwipeDeck = forwardRef(function SwipeDeck({
  data = [],
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onEndReached,
  renderEmpty,
}, ref) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // Keep latest values in refs so PanResponder (created once) never goes stale
  const currentIndexRef = useRef(currentIndex);
  const dataRef = useRef(data);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const onSwipeUpRef = useRef(onSwipeUp);
  const onEndReachedRef = useRef(onEndReached);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { onSwipeLeftRef.current = onSwipeLeft; }, [onSwipeLeft]);
  useEffect(() => { onSwipeRightRef.current = onSwipeRight; }, [onSwipeRight]);
  useEffect(() => { onSwipeUpRef.current = onSwipeUp; }, [onSwipeUp]);
  useEffect(() => { onEndReachedRef.current = onEndReached; }, [onEndReached]);

  // ── Swipe out — reads from refs so it always sees current index/data ──────
  const forceSwipe = useCallback((direction) => {
    const toValue =
      direction === 'right' ? { x: SCREEN_WIDTH * 1.5, y: 0 } :
      direction === 'left'  ? { x: -SCREEN_WIDTH * 1.5, y: 0 } :
                              { x: 0, y: -SCREEN_HEIGHT * 1.5 };
    Animated.timing(position, {
      toValue,
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      const item = dataRef.current[currentIndexRef.current];
      if (direction === 'right') onSwipeRightRef.current?.(item);
      else if (direction === 'left') onSwipeLeftRef.current?.(item);
      else onSwipeUpRef.current?.(item);
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= dataRef.current.length - 2) onEndReachedRef.current?.();
        return next;
      });
    });
  }, [position]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [position]);

  // Store latest callbacks in refs for PanResponder
  const forceSwipeRef = useRef(forceSwipe);
  const resetPositionRef = useRef(resetPosition);
  useEffect(() => { forceSwipeRef.current = forceSwipe; }, [forceSwipe]);
  useEffect(() => { resetPositionRef.current = resetPosition; }, [resetPosition]);

  // Expose swipeLeft / swipeRight / swipeUp to parent via ref
  useImperativeHandle(ref, () => ({
    swipeLeft: () => forceSwipeRef.current('left'),
    swipeRight: () => forceSwipeRef.current('right'),
    swipeUp: () => forceSwipeRef.current('up'),
  }));

  // ── Pan Responder — created once, delegates through refs ─────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -SWIPE_UP_THRESHOLD && Math.abs(gesture.dx) < SWIPE_THRESHOLD) {
          forceSwipeRef.current('up');
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipeRef.current('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipeRef.current('left');
        } else {
          resetPositionRef.current();
        }
      },
      onPanResponderTerminate: () => {
        resetPositionRef.current();
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

  const maybeOpacity = position.y.interpolate({
    inputRange: [-SCREEN_HEIGHT * 0.15, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // ── Render ────────────────────────────────────────────────────────────────
  if (currentIndex >= data.length) {
    return (
      <View style={styles.container}>
        {renderEmpty ? renderEmpty() : <DefaultEmpty />}
      </View>
    );
  }

  const cards = data
    .slice(currentIndex, currentIndex + CARDS_IN_VIEW)
    .map((item, i) => {
      const isTop = i === 0;

      if (isTop) {
        return (
          <Animated.View
            key={item.id}
            style={[
              styles.cardContainer,
              {
                zIndex: 10,
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
              <Text style={[styles.badgeText, { color: Colors.like }]}>SAVE</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
              <Text style={[styles.badgeText, { color: Colors.nope }]}>SKIP</Text>
            </Animated.View>
            <Animated.View style={[styles.badge, styles.maybeBadge, { opacity: maybeOpacity }]}>
              <Text style={[styles.badgeText, { color: Colors.maybe }]}>MAYBE</Text>
            </Animated.View>
            {renderCard(item, { isTop: true, forceSwipe })}
          </Animated.View>
        );
      }

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
    .reverse();

  return <View style={styles.container}>{cards}</View>;
});

export default SwipeDeck;

// ── Public helpers to call from outside ──────────
// Use a ref on SwipeDeck and call ref.current.swipeLeft() / swipeRight()
// or use the forceSwipe prop passed into renderCard's second argument.

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
  maybeBadge: {
    alignSelf: 'center',
    left: '35%',
    borderColor: Colors.maybe,
    transform: [{ rotate: '-5deg' }],
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
