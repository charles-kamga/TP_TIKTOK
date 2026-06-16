/**
 * TikTok Clone — VideoCard.tsx
 * Lecteur vidéo vertical HLS avec Fallback MP4 d'urgence
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

// 1. Générer l'URL HLS (Lecture découpée)
const getHlsUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('video/upload/')) {
    let hlsUrl = url;
    if (url.endsWith('.mp4')) {
      hlsUrl = url.substring(0, url.lastIndexOf('.mp4')) + '.m3u8';
    }
    if (!hlsUrl.includes('sp_auto')) {
      return hlsUrl.replace('video/upload/', 'video/upload/sp_auto/');
    }
    return hlsUrl;
  }
  return url;
};

// 2. Générer l'URL de repli MP4 optimisé (Disponibilité immédiate)
const getMp4FallbackUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('video/upload/')) {
    if (!url.includes('f_mp4')) {
      return url.replace('video/upload/', 'video/upload/f_mp4,q_auto/');
    }
  }
  return url;
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
  
  // États de secours
  const [useFallback, setUseFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setIsPlaying(true);
    }
  }, [isActive]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Préparation des deux URLs
  const hlsUrl = getHlsUrl(video.videoUrl);
  const mp4FallbackUrl = getMp4FallbackUrl(video.videoUrl);

  // Choix de l'URL active
  const currentVideoUrl = useFallback ? mp4FallbackUrl : hlsUrl;
  const currentVideoType = useFallback ? undefined : 'm3u8';

  const isValid = !!video.videoUrl && (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://'));


  // CORRECTIF DE RAPIDITÉ : Court-circuit (Timeout) de 2.5 secondes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Si la vidéo est active, en cours de chargement et que nous n'avons pas encore basculé
    if (isActive && isLoading && !useFallback && !hasError) {
      timeoutId = setTimeout(() => {
        // Si après 2.5 secondes le loader tourne toujours, on force la bascule MP4 d'urgence
        if (isLoading) {
          console.log("⏰ HLS trop long à charger (limite de 2.5s atteinte). Bascule d'urgence immédiate vers MP4 !");
          setUseFallback(true);
        }
      }, 2500); // 2500 millisecondes (ajustable selon vos préférences)
    }

    // Nettoyage du minuteur si le composant est désactivé ou si le chargement se termine
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isActive, isLoading, useFallback, hasError]);
  

  return (
    <View style={styles.container}>
      {/* 1. Le lecteur vidéo en arrière-plan */}
      {isValid && !hasError && (
        <Video
          ref={videoRef}
          // CORRECTIF 1 : On passe uniquement l'URI, sans forcer la propriété "type"
          // pour laisser ExoPlayer détecter et lier automatiquement l'audio et la vidéo.
          source={{ uri: currentVideoUrl }} 
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          repeat
          paused={!isActive || !isPlaying}
          useTextureView={true}
          
          // CORRECTIF 2 : On force la gestion du volume à 1.0 (non muet) pour Android
          volume={1.0}
          muted={false}

          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onReadyForDisplay={() => setIsLoading(false)}
          onError={(e) => {
            console.log("Erreur détectée sur la vidéo :", e);
            
            if (!useFallback) {
              console.log("Bascule automatique en cours vers le MP4 d'urgence...");
              setUseFallback(true);
              setIsLoading(true);
            } else {
              setHasError(true);
              setIsLoading(false);
            }
          }}
        />
      )}

      {/* Affichage de secours en cas d'erreur de lien définitive */}
      {(!isValid || hasError) && (
        <View style={[styles.video, styles.errorPlaceholder]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Vidéo non disponible</Text>
          <Text style={styles.errorSubtitle}>
            Le format ou le lien de ce post n'est pas supporté.
          </Text>
        </View>
      )}

      {/* 2. Vitre tactile pour la pause/lecture */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlayPause}
        style={styles.touchableOverlay}
      >
        {isLoading && isValid && !hasError && (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        )}

        {!isPlaying && isValid && !hasError && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.8)" />
          </View>
        )}
      </TouchableOpacity>

      {/* 3. Informations de bas de carte */}
      <View style={styles.bottomInfo}>
        <Text style={styles.username}>@createur_{video.userId?.substring(0, 5) || 'anonyme'}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {video.description || 'Pas de description.'}
        </Text>
        {/* Petit badge optionnel indiquant si la vidéo tourne en mode découpé (HLS) ou optimisé de secours (MP4) */}
        <Text style={{ color: COLORS.gray, fontSize: 10, marginTop: 5 }}>
          Mode de flux : {useFallback ? '⚡ MP4 d\'urgence' : '📡 HLS découpé'}
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
    position: 'relative',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 60,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
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
    zIndex: 1,
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