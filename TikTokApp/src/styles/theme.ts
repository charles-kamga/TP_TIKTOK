/**
 * TikTok Clone — theme.ts
 * Couleurs et styles globaux de toute l'application
 * Dev 8 — UI/Style
 */

import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─────────────────────────────────────────
// COULEURS
// ─────────────────────────────────────────
export const COLORS = {
  // Couleurs principales TikTok
  primary: '#FF0050',       // Rouge TikTok
  secondary: '#00F2EA',     // Cyan TikTok
  black: '#000000',         // Fond principal
  blackDeep: '#050505',     // Fond ultra-profond pour écrans premium
  white: '#FFFFFF',         // Texte principal
  darkGray: '#1C1C1C',      // Fond des cartes
  darkObsidian: '#0F0F12',  // Gris obsidian texturé
  gray: '#555555',          // Texte secondaire
  lightGray: '#888888',     // Icônes inactives/textes secondaires clairs
  border: '#222222',        // Bordures standard
  borderGlow: '#333333',    // Bordures en surbrillance

  // Statuts
  success: '#00C851',
  error: '#FF4444',
  warning: '#FFBB33',

  // Surfaces
  surface: '#111111',
  surfaceLight: '#1A1A1A',

  // États like
  like: '#FF0050',
  likeInactive: '#FFFFFF',

  // Overlays vidéo & Glassmorphism
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBgDark: 'rgba(15, 15, 18, 0.65)',
  transparent: 'transparent',
};

// Gradients configurés pour l'application
export const GRADIENTS = {
  primary: ['#FF0050', '#80003A'],
  secondary: ['#00F2EA', '#007A75'],
  darkCard: ['#19191C', '#0F0F12'],
  glassGlow: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
};

// Ombres et halos (glowing) pour le design premium
export const SHADOWS = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glowPrimary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  glowSecondary: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};

// ─────────────────────────────────────────
// TYPOGRAPHIE
// ─────────────────────────────────────────
export const FONTS = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 28,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

// ─────────────────────────────────────────
// ESPACEMENTS
// ─────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 999,
};

// ─────────────────────────────────────────
// DIMENSIONS
// ─────────────────────────────────────────
export const DIMENSIONS = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,

  // Icônes
  iconSm: 18,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  // Avatar
  avatarSm: 32,
  avatarMd: 44,
  avatarLg: 60,

  // Boutons
  buttonHeight: 48,
  buttonHeightSm: 36,

  // Tab bar
  tabBarHeight: 60,
};

// ─────────────────────────────────────────
// ICÔNES — Noms Ionicons pour toute l'équipe
// Utiliser avec : import { Ionicons } from '@expo/vector-icons'
// ─────────────────────────────────────────
export const ICONS = {
  // Tab bar
  home: 'home',
  homeOutline: 'home-outline',
  upload: 'add-circle',
  uploadOutline: 'add-circle-outline',
  profile: 'person-circle',
  profileOutline: 'person-circle-outline',

  // Actions vidéo
  like: 'heart',
  likeOutline: 'heart-outline',
  comment: 'chatbubble-ellipses',
  commentOutline: 'chatbubble-ellipses-outline',
  share: 'arrow-redo',

  // Navigation
  back: 'chevron-back',
  close: 'close',
  search: 'search',
  settings: 'settings-outline',

  // Profil
  edit: 'pencil',
  camera: 'camera',
  image: 'image',

  // Lecture vidéo
  play: 'play',
  pause: 'pause',
  mute: 'volume-mute',
  unmute: 'volume-high',
};

// ─────────────────────────────────────────
// STYLES COMMUNS RÉUTILISABLES
// ─────────────────────────────────────────
export const commonStyles = StyleSheet.create({

  // ── Conteneurs ──────────────────────────
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Textes ──────────────────────────────
  textPrimary: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weight.regular,
  },
  textSecondary: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.sm,
  },
  textBold: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weight.bold,
  },
  textTitle: {
    color: COLORS.white,
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weight.bold,
  },
  textCaption: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.xs,
  },

  // ── Boutons ─────────────────────────────
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    height: DIMENSIONS.buttonHeight,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weight.bold,
  },
  buttonOutline: {
    backgroundColor: COLORS.transparent,
    height: DIMENSIONS.buttonHeight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  buttonOutlineText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weight.semiBold,
  },

  // ── Inputs ──────────────────────────────
  input: {
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.white,
    height: DIMENSIONS.buttonHeight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // ── Carte ───────────────────────────────
  card: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // ── Séparateur ──────────────────────────
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  // ── Overlay vidéo ───────────────────────
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
  },

  // ── Avatars ─────────────────────────────
  avatarMd: {
    width: DIMENSIONS.avatarMd,
    height: DIMENSIONS.avatarMd,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.darkGray,
  },
  avatarLg: {
    width: DIMENSIONS.avatarLg,
    height: DIMENSIONS.avatarLg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.darkGray,
  },

  // ── Loading ─────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
});

// ─────────────────────────────────────────
// EXEMPLE D'UTILISATION
// ─────────────────────────────────────────
//
// import { COLORS, FONTS, SPACING, BORDER_RADIUS, DIMENSIONS, ICONS, commonStyles } from '../styles/theme';
// import { Ionicons } from '@expo/vector-icons';
//
// <View style={commonStyles.screenContainer}>
//   <Text style={commonStyles.textTitle}>Mon Titre</Text>
//   <TouchableOpacity style={commonStyles.buttonPrimary}>
//     <Text style={commonStyles.buttonPrimaryText}>Publier</Text>
//   </TouchableOpacity>
//   <Ionicons name={ICONS.like} size={DIMENSIONS.iconLg} color={COLORS.like} />
// </View>