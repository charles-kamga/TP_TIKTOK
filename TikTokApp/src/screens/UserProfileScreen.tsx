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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../config/firebaseconfig';
import { getUserProfile } from '../services/userService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Header from '../components/Header';

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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Header title="Profil Public" showBackButton />

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
            activeOpacity={0.8}
          >
            <Ionicons name="mail" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.messageButtonText}>Envoyer un message</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep 
  },
  profileContainer: { 
    alignItems: 'center', 
    marginTop: 40, 
    paddingHorizontal: 24 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: COLORS.darkGray,
  },
  username: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.xl + 2, 
    fontWeight: '800', 
    marginBottom: 8 
  },
  bio: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.md, 
    textAlign: 'center', 
    marginBottom: 30,
    lineHeight: 20,
  },
  messageButton: { 
    flexDirection: 'row',
    backgroundColor: COLORS.primary, 
    borderRadius: BORDER_RADIUS.lg, 
    paddingVertical: 14, 
    width: '100%', 
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glowPrimary,
  },
  messageButtonText: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.md + 1, 
    fontWeight: '800' 
  },
  myProfileBadge: { 
    backgroundColor: COLORS.darkObsidian, 
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: BORDER_RADIUS.md 
  },
  myProfileText: { 
    color: COLORS.lightGray, 
    fontWeight: '600',
    fontSize: FONTS.sizes.sm + 1,
  },
  center: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

export default UserProfileScreen;