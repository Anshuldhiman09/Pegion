export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  sand: string;
  earth: string;
  skyMist: string;
  border: string;
  divider: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholderText: string;
  statusBar: 'light-content' | 'dark-content';
  statusBg: string;
  badge: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
  neumorphic: {
    capsuleBg: string;
    capsuleBorder: string;
    capsuleBorderTop: string;
    capsuleBorderBottom: string;
    buttonInactiveBg: string;
    buttonInactiveBorderTop: string;
    buttonInactiveBorderBottom: string;
    buttonActiveBg: string;
    buttonActiveBorderTop: string;
    buttonActiveBorderBottom: string;
    sunkenCircleBg: string;
    sunkenCircleBorderTop: string;
    sunkenCircleBorderBottom: string;
    iconInactive: string;
    iconActive: string;
  };
}

// Exact Clever Chameleon Pigeon Palette:
// 1. #F5743D - Tangerine Pigeon Foot & Eye Orange (Vibrant Accent / Badges / Buttons)
// 2. #E5CFC2 - Warm Sand Beige (Soft Highlights / Warm Accents)
// 3. #CBDDE1 - Sky Mist Slate (Soft light background / Dark mode secondary)
// 4. #30A8C1 - Cyan Cerulean Blue (Secondary Vibrant Accent / Active states)
// 5. #056F89 - Deep Ocean Teal (Petrol Blue Brand Tone)
// 6. #1F414B - Charcoal Slate Navy (Core dark surface & light text)
// 7. #572D1F - Warm Espresso Earth (Earthy Contrast)

export const darkColors: ThemeColors = {
  background: '#14252B',
  surface: '#1F414B',
  surfaceSubtle: '#264B56',
  card: '#1F414B',
  cardBorder: 'rgba(203, 221, 225, 0.12)',
  text: '#F4F8FA',
  textSecondary: '#CBDDE1',
  textMuted: '#8CA7AE',
  primary: '#F5743D',
  primaryLight: 'rgba(245, 116, 61, 0.18)',
  secondary: '#30A8C1',
  accent: '#056F89',
  sand: '#E5CFC2',
  earth: '#572D1F',
  skyMist: '#CBDDE1',
  border: 'rgba(203, 221, 225, 0.14)',
  divider: 'rgba(203, 221, 225, 0.08)',
  inputBackground: '#172E35',
  inputBorder: 'rgba(203, 221, 225, 0.16)',
  inputText: '#FFFFFF',
  placeholderText: '#8CA7AE',
  statusBar: 'light-content',
  statusBg: '#14252B',
  badge: '#F5743D',
  success: '#30A8C1',
  danger: '#F5743D',
  warning: '#F5743D',
  overlay: 'rgba(19, 37, 43, 0.75)',
  neumorphic: {
    capsuleBg: '#172E35',
    capsuleBorder: 'rgba(203, 221, 225, 0.12)',
    capsuleBorderTop: 'rgba(203, 221, 225, 0.22)',
    capsuleBorderBottom: 'rgba(0, 0, 0, 0.85)',
    buttonInactiveBg: '#1F414B',
    buttonInactiveBorderTop: 'rgba(203, 221, 225, 0.20)',
    buttonInactiveBorderBottom: 'rgba(0, 0, 0, 0.75)',
    buttonActiveBg: '#112025',
    buttonActiveBorderTop: 'rgba(0, 0, 0, 0.95)',
    buttonActiveBorderBottom: 'rgba(203, 221, 225, 0.18)',
    sunkenCircleBg: '#112025',
    sunkenCircleBorderTop: 'rgba(0, 0, 0, 0.85)',
    sunkenCircleBorderBottom: 'rgba(203, 221, 225, 0.15)',
    iconInactive: '#CBDDE1',
    iconActive: '#F5743D',
  },
};

export const lightColors: ThemeColors = {
  background: '#F2F6F8',
  surface: '#FFFFFF',
  surfaceSubtle: '#E4ECEF',
  card: '#FFFFFF',
  cardBorder: 'rgba(31, 65, 75, 0.08)',
  text: '#1F414B',
  textSecondary: '#056F89',
  textMuted: '#73939C',
  primary: '#F5743D',
  primaryLight: 'rgba(245, 116, 61, 0.12)',
  secondary: '#056F89',
  accent: '#30A8C1',
  sand: '#E5CFC2',
  earth: '#572D1F',
  skyMist: '#CBDDE1',
  border: 'rgba(31, 65, 75, 0.10)',
  divider: 'rgba(31, 65, 75, 0.06)',
  inputBackground: '#E4ECEF',
  inputBorder: 'rgba(31, 65, 75, 0.12)',
  inputText: '#1F414B',
  placeholderText: '#73939C',
  statusBar: 'dark-content',
  statusBg: '#F2F6F8',
  badge: '#F5743D',
  success: '#056F89',
  danger: '#F5743D',
  warning: '#F5743D',
  overlay: 'rgba(31, 65, 75, 0.45)',
  neumorphic: {
    capsuleBg: '#FFFFFF',
    capsuleBorder: 'rgba(31, 65, 75, 0.08)',
    capsuleBorderTop: 'rgba(255, 255, 255, 0.95)',
    capsuleBorderBottom: 'rgba(31, 65, 75, 0.14)',
    buttonInactiveBg: '#E4ECEF',
    buttonInactiveBorderTop: 'rgba(255, 255, 255, 0.95)',
    buttonInactiveBorderBottom: 'rgba(31, 65, 75, 0.12)',
    buttonActiveBg: '#CBDDE1',
    buttonActiveBorderTop: 'rgba(31, 65, 75, 0.22)',
    buttonActiveBorderBottom: 'rgba(255, 255, 255, 0.9)',
    sunkenCircleBg: '#D9E6E9',
    sunkenCircleBorderTop: 'rgba(31, 65, 75, 0.18)',
    sunkenCircleBorderBottom: 'rgba(255, 255, 255, 0.85)',
    iconInactive: '#056F89',
    iconActive: '#F5743D',
  },
};
