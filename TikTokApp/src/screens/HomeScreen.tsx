/**
 * TikTok Clone — HomeScreen.tsx
 * Fil vertical avec lecteur vidéo (dave) + likes/commentaires Firebase (MVP)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  ViewToken,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import CommentsScreen from './CommentsScreen';
import VideoCard, { VideoData } from '../components/VideoCard';
import { auth, db } from '../config/firebaseconfig';
import { likeVideo, unlikeVideo } from '../services/interactionService';
import { getUserProfile } from '../services/userService';
import { COLORS } from '../styles/theme';

const { height: screenHeight } = Dimensions.get('window');

const DEMO_VIDEOS: VideoData[] = [
  {
    id: 'demo1',
    userId: 'demo_user_1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Découvrez le clone TikTok en React Native ! #ReactNative #Firebase',
    likesCount: 1240,
  },
  {
    id: 'demo2',
    userId: 'demo_user_2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'Ma première vidéo TikTok ! #debut',
    likesCount: 890,
  },
];

const HomeScreen = ({ navigation }: any) => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [videoLikeCounts, setVideoLikeCounts] = useState<Record<string, number>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});

  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const videosRef = collection(db, 'videos');
      const q = query(videosRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setVideos(DEMO_VIDEOS);
        const counts: Record<string, number> = {};
        DEMO_VIDEOS.forEach(v => { counts[v.id] = v.likesCount; });
        setVideoLikeCounts(counts);
        setActiveVideoId(DEMO_VIDEOS[0]?.id ?? null);
        return;
      }

      const fetched: VideoData[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId ?? 'user',
          videoUrl: data.videoUrl ?? '',
          description: data.description ?? '',
          likesCount: data.likesCount ?? 0,
        };
      });

      setVideos(fetched);
      const counts: Record<string, number> = {};
      fetched.forEach(v => { counts[v.id] = v.likesCount; });
      setVideoLikeCounts(counts);
      setActiveVideoId(fetched[0]?.id ?? null);

      // Fetch usernames for each unique userId
      const uniqueUserIds = [...new Set(fetched.map(v => v.userId))];
      const usernameMap: Record<string, string> = {};
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            if (profile?.username) {
              usernameMap[userId] = profile.username;
            }
          } catch (error) {
            console.error('Erreur récupération username:', error);
          }
        })
      );
      
      setUsernames(usernameMap);
    } catch (error) {
      console.error('Erreur chargement vidéos:', error);
      setVideos(DEMO_VIDEOS);
      const counts: Record<string, number> = {};
      DEMO_VIDEOS.forEach(v => { counts[v.id] = v.likesCount; });
      setVideoLikeCounts(counts);
      setActiveVideoId(DEMO_VIDEOS[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleLike = async (videoId: string) => {
    if (!auth.currentUser) return;

    const isLiked = likedVideos.has(videoId);
    try {
      if (isLiked) {
        await unlikeVideo(videoId, auth.currentUser.uid);
        setLikedVideos(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
        setVideoLikeCounts(prev => ({
          ...prev,
          [videoId]: Math.max(0, (prev[videoId] || 0) - 1),
        }));
      } else {
        await likeVideo(videoId, auth.currentUser.uid);
        setLikedVideos(prev => new Set(prev).add(videoId));
        setVideoLikeCounts(prev => ({
          ...prev,
          [videoId]: (prev[videoId] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Erreur like/unlike:', error);
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item?.id) {
        setActiveVideoId(viewableItems[0].item.id);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BOUTON DE RECHERCHE FLOTTANT (En haut à droite) */}
      <TouchableOpacity 
        style={styles.searchButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SearchUsers')}
      >
        <Ionicons name="search" size={26} color={COLORS.white} />
      </TouchableOpacity>

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <VideoCard
            video={{ ...item, likesCount: videoLikeCounts[item.id] ?? item.likesCount }}
            isActive={activeVideoId === item.id}
            isLiked={likedVideos.has(item.id)}
            onLike={() => handleLike(item.id)}
            onComment={() => setSelectedVideoId(item.id)}
            navigation={navigation}
            username={usernames[item.userId]}
          />
        )}
        pagingEnabled
        snapToInterval={screenHeight - 60}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {selectedVideoId && (
        <CommentsScreen
          videoId={selectedVideoId}
          visible={!!selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.black,
  },
  searchButton: {
    position: 'absolute',
    // On adapte la hauteur selon l'encoche de l'iPhone ou d'Android
    top: Platform.OS === 'ios' ? 55 : 20, 
    right: 20,
    zIndex: 100, // Crucial : fait flotter le bouton au-dessus de toutes les vidéos
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Léger fond sombre pour que l'icône reste visible sur n'importe quelle vidéo
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
