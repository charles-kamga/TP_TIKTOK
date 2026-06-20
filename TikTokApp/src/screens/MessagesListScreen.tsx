import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { auth } from '../config/firebaseconfig';
import { subscribeToUserRooms } from '../services/chatService';
import { getUserProfile } from '../services/userService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

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
      // Pour chaque room, récupérer les infos de l'autre utilisateur
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

      // Filtrer les nulls et trier par date de mise à jour
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
        <Text style={styles.userName}>{item.otherUserName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={styles.arrow}>❯</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages 💬</Text>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucun message pour le moment</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  list: { paddingHorizontal: 16, paddingVertical: 12 },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  roomInfo: { flex: 1 },
  userName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  lastMessage: { color: COLORS.lightGray, fontSize: 14, marginTop: 4 },
  arrow: { color: COLORS.gray, fontSize: 16, marginRight: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.lightGray, fontSize: 14 },
});

export default MessagesListScreen;
