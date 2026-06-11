/**
 * TikTok Clone — cloudinaryConfig.ts
 * Fichier de configuration pour l'intégration de Cloudinary
 */
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_VIDEO_UPLOAD_PRESET, CLOUDINARY_IMAGE_UPLOAD_PRESET } from '@env';

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  // Presets d'upload non signés créés sur votre console Cloudinary
  videoUploadPreset: CLOUDINARY_VIDEO_UPLOAD_PRESET, // Preset pour les vidéos
  imageUploadPreset: CLOUDINARY_IMAGE_UPLOAD_PRESET, // Preset pour les images
};

export default CLOUDINARY_CONFIG;
