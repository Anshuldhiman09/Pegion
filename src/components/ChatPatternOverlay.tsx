import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DOODLE_ICONS = [
  'paper-plane-outline',
  'chatbubble-outline',
  'heart-outline',
  'sparkles-outline',
  'cafe-outline',
  'musical-notes-outline',
  'happy-outline',
  'star-outline',
  'planet-outline',
  'compass-outline',
  'game-controller-outline',
  'headset-outline',
  'bulb-outline',
  'flame-outline',
  'leaf-outline',
  'send-outline',
];

interface ChatPatternOverlayProps {
  isDark?: boolean;
}

export const ChatPatternOverlay: React.FC<ChatPatternOverlayProps> = React.memo(
  ({ isDark }) => {
    // Generate an 8x6 icon grid
    const rows = 10;
    const cols = 5;
    const iconColor = isDark ? '#ffffff' : '#000000';
    const opacity = isDark ? 0.045 : 0.035;

    return (
      <View style={styles.container} pointerEvents="none">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {Array.from({ length: cols }).map((_, cIdx) => {
              const iconName =
                DOODLE_ICONS[(rIdx * cols + cIdx) % DOODLE_ICONS.length];
              const rotation = ((rIdx + cIdx) % 4) * 15 - 20;

              return (
                <View
                  key={`col-${cIdx}`}
                  style={[
                    styles.iconBox,
                    { transform: [{ rotate: `${rotation}deg` }] },
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={22}
                    color={iconColor}
                    style={{ opacity }}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    justifyContent: 'space-around',
    paddingVertical: 10,
    zIndex: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: SCREEN_WIDTH,
  },
  iconBox: {
    width: SCREEN_WIDTH / 5,
    height: SCREEN_HEIGHT / 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatPatternOverlay;
