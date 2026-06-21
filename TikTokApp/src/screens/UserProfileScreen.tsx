import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { getUserProfile } from '../services/userService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

const UserProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params; 
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);

        if (data) {
          setProfile(data);
        } else {
          Alert.alert('Erreur', 'Cet utilisateur n’existe plus.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erreur profil :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isMe = currentUser?.uid === userId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>◀ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.profileContainer}>
        <Image
          source={{ uri: profile?.profilePic || profile?.avatarUrl || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{profile?.username || 'utilisateur'}</Text>
        <Text style={styles.bio}>{profile?.bio || 'Pas de bio pour le moment.'}</Text>

        {!isMe ? (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              navigation.navigate('Chat', {
                receiverId: userId,
                receiverName: profile?.username || 'Utilisateur',
              })
            }
          >
            <Text style={styles.messageButtonText}>✉️ Envoyer un message</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.myProfileBadge}>
            <Text style={styles.myProfileText}>Votre profil public</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backText: { color: COLORS.primary, fontWeight: '700' },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  profileContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  username: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  bio: { color: COLORS.lightGray, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  messageButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  messageButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  myProfileBadge: { backgroundColor: COLORS.darkGray, paddingVertical: 8, paddingHorizontal: 16, borderRadius: BORDER_RADIUS.md },
  myProfileText: { color: COLORS.lightGray, fontWeight: '600' },
  center: { flex: 1, backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' },
});

export default UserProfileScreen;