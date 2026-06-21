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
  Pressable,
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
  navigation?: any;
  username?: string;
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
  navigation,
  username,
}) => {
  const videoRef = useRef<VideoRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  const hlsUrl = getHlsUrl(video.videoUrl);
  const mp4FallbackUrl = getMp4FallbackUrl(video.videoUrl);
  const currentVideoUrl = useFallback ? mp4FallbackUrl : hlsUrl;

  const isValid = !!video.videoUrl && (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://'));

  return (
    <View style={styles.container}>
      {/* 1. Le lecteur vidéo en arrière-plan */}
      {isValid && (
        <Video
          source={{ uri: currentVideoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          repeat
          paused={!isActive || !isPlaying}
          useTextureView={true}
          hideShutterView={true}
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.log("Erreur vidéo:", e);
            if (!useFallback) setUseFallback(true);
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
      <Pressable
        onPress={togglePlayPause}
        style={styles.touchableOverlay}
        testID="video-touchable"
      >
        {isLoading && isValid && !hasError && (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        )}

        {!isPlaying && isValid && !hasError && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={60} color="rgba(255, 255, 255, 0.8)" />
          </View>
        )}
      </Pressable>

      {/* 3. Informations de bas de carte */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity onPress={() => navigation?.navigate('Chat', { receiverId: video.userId, receiverName: username || `createur_${video.userId?.substring(0, 5) || 'anonyme'}` })} activeOpacity={0.7}>
          <Text style={styles.username}>@{username || `createur_${video.userId?.substring(0, 5) || 'anonyme'}`}</Text>
        </TouchableOpacity>
        <Text style={styles.description} numberOfLines={2}>
          {video.description || 'Pas de description.'}
        </Text>
      </View>

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike} activeOpacity={0.7}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="heart"
              size={30}
              color={isLiked ? COLORS.primary : COLORS.white}
            />
          </View>
          <Text style={styles.actionText}>{video.likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment} activeOpacity={0.7}>
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
    marginRight: 0,
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