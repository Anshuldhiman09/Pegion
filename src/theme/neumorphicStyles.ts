import { StyleSheet, Platform, ViewStyle } from 'react-native';

export interface NeuOptions {
  radius?: number;
  depth?: 'low' | 'medium' | 'high';
  borderWidth?: number;
}

export const getNeumorphicStyles = (isDark: boolean) => {
  return {
    // 1. Elevated / Protruding Cards & Containers
    cardElevated: (options?: NeuOptions): ViewStyle => {
      const radius = options?.radius ?? 20;
      const depth = options?.depth ?? 'medium';
      const shadowOpacity = isDark
        ? depth === 'high' ? 0.75 : depth === 'low' ? 0.35 : 0.55
        : depth === 'high' ? 0.18 : depth === 'low' ? 0.06 : 0.12;
      const shadowRadius = depth === 'high' ? 12 : depth === 'low' ? 4 : 8;
      const elevation = depth === 'high' ? 8 : depth === 'low' ? 2 : 4;

      return {
        backgroundColor: isDark ? '#1F414B' : '#ffffff',
        borderRadius: radius,
        borderWidth: options?.borderWidth ?? 1,
        borderColor: isDark ? 'rgba(203, 221, 225, 0.10)' : 'rgba(31, 65, 75, 0.06)',
        borderTopColor: isDark ? 'rgba(203, 221, 225, 0.18)' : '#ffffff',
        borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(31, 65, 75, 0.12)',
        shadowColor: isDark ? '#000000' : '#1F414B',
        shadowOffset: { width: 0, height: depth === 'high' ? 6 : 3 },
        shadowOpacity,
        shadowRadius,
        elevation,
      };
    },

    // 2. Sunken / Inset Field (Search bars, text inputs, pressed states)
    fieldSunken: (options?: NeuOptions): ViewStyle => {
      const radius = options?.radius ?? 24;
      return {
        backgroundColor: isDark ? '#172E35' : '#E4ECEF',
        borderRadius: radius,
        borderWidth: options?.borderWidth ?? 1.2,
        borderColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(31, 65, 75, 0.10)',
        borderTopColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(31, 65, 75, 0.16)',
        borderBottomColor: isDark ? 'rgba(203, 221, 225, 0.15)' : 'rgba(255, 255, 255, 0.95)',
      };
    },

    // 3. Elevated Circular Buttons (Floating disc effect matching the reference image)
    circleButton: (size: number = 42, options?: NeuOptions): ViewStyle => {
      const depth = options?.depth ?? 'medium';
      const shadowRadius = depth === 'high' ? 10 : depth === 'low' ? 5 : 8;
      const shadowOpacity = isDark
        ? depth === 'high' ? 0.7 : depth === 'low' ? 0.35 : 0.5
        : depth === 'high' ? 0.20 : depth === 'low' ? 0.08 : 0.14;
      const elevation = depth === 'high' ? 7 : depth === 'low' ? 2 : 4;
      const shadowHeight = depth === 'high' ? 6 : depth === 'low' ? 2.5 : 4.5;
      const shadowWidth = depth === 'high' ? 3 : depth === 'low' ? 1.5 : 2.5;

      return {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isDark ? '#1F414B' : '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: options?.borderWidth ?? 1.5,
        borderColor: isDark ? 'rgba(203, 221, 225, 0.12)' : 'rgba(31, 65, 75, 0.05)',
        borderTopColor: isDark ? 'rgba(203, 221, 225, 0.25)' : '#ffffff',
        borderLeftColor: isDark ? 'rgba(203, 221, 225, 0.20)' : '#ffffff',
        borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(31, 65, 75, 0.14)',
        borderRightColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(31, 65, 75, 0.10)',
        shadowColor: isDark ? '#000000' : '#1F414B',
        shadowOffset: { width: shadowWidth, height: shadowHeight },
        shadowOpacity,
        shadowRadius,
        elevation,
      };
    },

    // 4. Sunken Inner Well (for active tab or avatar ring)
    sunkenWell: (size: number = 44): ViewStyle => {
      return {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isDark ? '#112025' : '#D9E6E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.2,
        borderColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(31, 65, 75, 0.10)',
        borderTopColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(31, 65, 75, 0.20)',
        borderBottomColor: isDark ? 'rgba(203, 221, 225, 0.15)' : 'rgba(255, 255, 255, 0.90)',
      };
    },

    // 5. Embossed Pill Badge
    badgeEmbossed: (customBg?: string): ViewStyle => {
      return {
        backgroundColor: customBg || (isDark ? '#264B56' : '#E4ECEF'),
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(203, 221, 225, 0.12)' : 'rgba(31, 65, 75, 0.06)',
        borderTopColor: isDark ? 'rgba(203, 221, 225, 0.22)' : 'rgba(255, 255, 255, 0.95)',
        borderBottomColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(31, 65, 75, 0.14)',
        shadowColor: isDark ? '#000000' : '#1F414B',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 2.5,
        elevation: 2,
      };
    },
  };
};

export default getNeumorphicStyles;
