import { Platform } from 'react-native';

/**
 * App-wide UI font (matches CrushNic / onboarding).
 * Use on StyleSheet text styles so typography stays consistent across tabs, modals, and auth.
 */
export const FONT_FAMILY_UI = Platform.OS === 'ios' ? 'System' : 'sans-serif';
