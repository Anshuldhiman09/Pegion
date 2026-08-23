import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';

interface TypingIndicatorProps {
  visible: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible }) => {
  const { colors } = useTheme();

  // Animations for 3 dots (bouncing effect)
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;

  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  // Container fade/scale animation
  const containerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in container
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Helper to create dot bouncing loop
      const createDotAnimation = (
        yVal: Animated.Value,
        opVal: Animated.Value,
        delay: number,
      ) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.sequence([
                Animated.timing(yVal, {
                  toValue: -5,
                  duration: 250,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(yVal, {
                  toValue: 0,
                  duration: 250,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(opVal, {
                  toValue: 1,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(opVal, {
                  toValue: 0.4,
                  duration: 250,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            Animated.delay(Math.max(0, 400 - delay)),
          ]),
        );
      };

      const anim1 = createDotAnimation(dot1Y, dot1Opacity, 0);
      const anim2 = createDotAnimation(dot2Y, dot2Opacity, 160);
      const anim3 = createDotAnimation(dot3Y, dot3Opacity, 320);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      Animated.timing(containerAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, containerAnim, dot1Y, dot2Y, dot3Y, dot1Opacity, dot2Opacity, dot3Opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerAnim,
          transform: [
            {
              scale: containerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            {
              translateY: containerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot1Opacity,
              transform: [{ translateY: dot1Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot2Opacity,
              transform: [{ translateY: dot2Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: colors.primary,
              opacity: dot3Opacity,
              transform: [{ translateY: dot3Y }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    gap: 5,
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

export default TypingIndicator;
