/**
 * TikTok Clone — VideoCard.tsx
 * Lecteur vidéo vertical ultra-sécurisé contre les crashs
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Video, { ResizeMode, VideoRef } from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS } from '../styles/theme';

export interface VideoData {
  id: string;
  userId: string;
  videoUrl: string;
  description: string;
  likesCount: number;
}

interface VideoCardProps {
  video: VideoData;
  isActive: boolean;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. Analyse et validation de l'URL pour éviter de faire crasher le lecteur natif
const getValidatedAndOptimizedUrl = (url: string): { isValid: boolean; url: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, url: '' };
  }

  const cleanUrl = url.trim();

  // Vérification basique du protocole
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return { isValid: false, url: '' };
  }

  // Si c'est une URL Cloudinary, on force le format MP4 compressé
  if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('video/upload/')) {
    if (!cleanUrl.includes('f_mp4')) {
      // Nous utilisons f_mp4 au lieu de f_auto pour garantir la lecture sur ExoPlayer
      return { isValid: true, url: cleanUrl.replace('video/upload/', 'video/upload/f_mp4,q_auto/') };
    }
  }

  return { isValid: true, url: cleanUrl };
};

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isActive,
  isLiked = false,
  onLike,
  onComment,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(true);
    }
  }, [isActive]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Traiter l'URL
  const { isValid, url: finalVideoUrl } = getValidatedAndOptimizedUrl(video.videoUrl);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={styles.videoWrapper}
      >
        {/* Rendu conditionnel ultra-sécurisé */}
        {isValid && !hasError ? (
          <Video
            ref={videoRef}
            source={{ uri: finalVideoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            repeat
            paused={!isActive || !isPlaying}
            onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={(e) => {
              console.log("Erreur de décodage de la vidéo :", e);
              setHasError(true);
              setIsLoading(false);
            }}
          />
        ) : (
          // Affichage de remplacement élégant en cas d'URL vide, invalide ou de lien mort
          <View style={[styles.video, styles.errorPlaceholder]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Vidéo non disponible</Text>
            <Text style={styles.errorSubtitle}>
              Le format ou le lien de ce post de test n'est pas supporté par votre émulateur.
            </Text>
          </View>
        )}

        {isLoading && isValid && !hasError && (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        )}

        {!isPlaying && isValid && !hasError && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.8)" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.bottomInfo}>
        <Text style={styles.username}>@createur_{video.userId?.substring(0, 5) || 'anonyme'}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {video.description || 'Pas de description.'}
        </Text>
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="heart"
              size={30}
              color={isLiked ? COLORS.primary : COLORS.white}
            />
          </View>
          <Text style={styles.actionText}>{video.likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.white} />
          </View>
          <Text style={styles.actionText}>Commenter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 60,
    backgroundColor: COLORS.black,
  },
  videoWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  loader: {
    position: 'absolute',
  },
  playOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    width: SCREEN_WIDTH * 0.7,
    zIndex: 10,
  },
  username: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
  },
  sideActions: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  errorPlaceholder: {
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  errorTitle: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default VideoCard;
