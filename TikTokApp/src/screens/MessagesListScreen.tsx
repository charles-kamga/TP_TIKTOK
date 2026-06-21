import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../config/firebaseconfig';
import { subscribeToUserRooms } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Header from '../components/Header';

interface Room {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: any;
}

interface RoomWithUserInfo extends Room {
  otherUserId: string;
  otherUserName: string;
  otherUserPic: string;
}

const MessagesListScreen = ({ navigation }: any) => {
  const [rooms, setRooms] = useState<RoomWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubscribe = subscribeToUserRooms(currentUser.uid, async (roomsData: Room[]) => {
      const roomsWithUserInfo = await Promise.all(
        roomsData.map(async (room) => {
          const otherUserId = room.participants.find((id: string) => id !== currentUser.uid);
          if (!otherUserId) return null;

          try {
            const userProfile = await getUserProfile(otherUserId);
            return {
              ...room,
              otherUserId,
              otherUserName: userProfile?.username || 'Utilisateur',
              otherUserPic: userProfile?.profilePic || 'https://via.placeholder.com/50',
            };
          } catch (error) {
            console.error('Erreur récupération profil:', error);
            return {
              ...room,
              otherUserId,
              otherUserName: 'Utilisateur',
              otherUserPic: 'https://via.placeholder.com/50',
            };
          }
        })
      );

      const validRooms = roomsWithUserInfo
        .filter((room): room is RoomWithUserInfo => room !== null)
        .sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });

      setRooms(validRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderRoomItem = ({ item }: { item: RoomWithUserInfo }) => (
    <TouchableOpacity
      style={styles.roomCard}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('Chat', {
          receiverId: item.otherUserId,
          receiverName: item.otherUserName,
        })
      }
    >
      <Image
        source={{ uri: item.otherUserPic }}
        style={styles.avatar}
      />
      <View style={styles.roomInfo}>
        <Text style={styles.userName}>@{item.otherUserName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <Header title="Messages" showBackButton />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Header title="Messages" showBackButton />

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={44} color={COLORS.gray} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep 
  },
  list: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.md 
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkObsidian,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roomInfo: { 
    flex: 1 
  },
  userName: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.md, 
    fontWeight: '700' 
  },
  lastMessage: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.sm + 1, 
    marginTop: 4 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 60 
  },
  emptyText: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.md - 1 
  },
});

export default MessagesListScreen;
