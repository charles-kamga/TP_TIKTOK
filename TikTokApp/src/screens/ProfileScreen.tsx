/**
 * TikTok Clone — ProfileScreen.tsx
 * Dev 6 — Ecran Profil utilisateur
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import { auth, db } from '../config/firebaseconfig';
import { CLOUDINARY_CONFIG } from '../config/cloudinaryConfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, commonStyles } from '../styles/theme';
import { getUserProfile, updateProfile } from '../services/userService';

interface UserProfile {
  uid: string;
  username: string;
  profilePic: string;
  bio: string;
  followers: number;
  following: number;
}

interface VideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  likesCount: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

const ProfileScreen = ({ navigation }: any) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [newImage, setNewImage] = useState<{ uri: string; type: string; name: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsubscribe;
  }, []);

  const loadProfile = useCallback(async (uid: string) => {
    setLoadingProfile(true);
    try {
      const data = await getUserProfile(uid);
      if (data) {
        const up = data as UserProfile;
        setProfile(up);
        setEditUsername(up.username || '');
        setEditBio(up.bio || '');
        setEditProfilePic(up.profilePic || '');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Profil introuvable');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const loadVideos = useCallback(async (uid: string) => {
    setLoadingVideos(true);
    try {
      const q = query(collection(db, 'videos'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
      const querySnap = await getDocs(q);
      setVideos(querySnap.docs.map(d => ({ id: d.id, ...d.data() } as VideoItem)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      loadProfile(currentUser.uid);
      loadVideos(currentUser.uid);
    }
  }, [currentUser, loadProfile, loadVideos]);

  const handleSaveProfile = async () => {
    if (!currentUser?.uid || !editUsername.trim()) return;
    setSavingProfile(true);
    let finalPic = editProfilePic;
    try {
      if (newImage) {
        const data = new FormData();
        data.append('file', { uri: Platform.OS === 'android' ? newImage.uri : newImage.uri.replace('file://', ''), type: newImage.type, name: newImage.name } as any);
        data.append('upload_preset', CLOUDINARY_CONFIG.imageUploadPreset || 't1ahbbgz');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: data });
        const result = await res.json();
        if (res.ok) finalPic = result.secure_url;
      }
      const updated = await updateProfile(currentUser.uid, { username: editUsername, bio: editBio, profilePic: finalPic });
      setProfile(prev => prev ? { ...prev, ...updated } : null);
      setEditModalVisible(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (e) {
      Alert.alert('Erreur de sauvegarde');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loadingProfile) return <View style={commonStyles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={commonStyles.screenContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={commonStyles.textTitle}>@{profile?.username}</Text>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.smallBtn}><Text style={{ color: COLORS.error }}>Quitter</Text></TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Image source={{ uri: profile?.profilePic || 'https://via.placeholder.com/100' }} style={commonStyles.avatarLg} />
          <View style={styles.statsRow}>
            <View style={commonStyles.centered}><Text style={commonStyles.textBold}>{videos.length}</Text><Text style={commonStyles.textCaption}>Videos</Text></View>
            <View style={commonStyles.centered}><Text style={commonStyles.textBold}>{profile?.followers || 0}</Text><Text style={commonStyles.textCaption}>Abonnés</Text></View>
          </View>
        </View>

        <View style={{ padding: SPACING.md }}>
          <Text style={commonStyles.textBold}>{profile?.username}</Text>
          <Text style={commonStyles.textPrimary}>{profile?.bio || 'Pas de bio'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UsersList')}>
            <Text style={{color: COLORS.primary, marginTop: 8}}>Voir tous les utilisateurs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MessagesList')}>
            <Text style={{color: COLORS.primary, marginTop: 8}}>💬 Messages</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={commonStyles.buttonOutline} onPress={() => setEditModalVisible(true)}>
          <Text style={commonStyles.buttonOutlineText}>Modifier le profil</Text>
        </TouchableOpacity>

        <View style={commonStyles.divider} />

        {loadingVideos ? <ActivityIndicator color={COLORS.primary} /> : (
          <FlatList
            data={videos}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.gridItem}><Image source={{ uri: item.thumbnailUrl || item.videoUrl }} style={styles.gridImg} /></TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune vidéo</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalFull}>
          <View style={commonStyles.card}>
            <View style={commonStyles.rowBetween}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={{ color: COLORS.gray }}>Annuler</Text></TouchableOpacity>
              <Text style={commonStyles.textBold}>Editer</Text>
              <TouchableOpacity onPress={handleSaveProfile}><Text style={{ color: COLORS.primary }}>OK</Text></TouchableOpacity>
            </View>
            <TextInput style={commonStyles.input} value={editUsername} onChangeText={setEditUsername} placeholder="Pseudo" placeholderTextColor={COLORS.gray} />
            <TextInput style={[commonStyles.input, { height: 80 }]} value={editBio} onChangeText={setEditBio} placeholder="Bio" multiline placeholderTextColor={COLORS.gray} />
            <TouchableOpacity style={commonStyles.buttonPrimary} onPress={() => launchImageLibrary({ mediaType: 'photo' }, r => r.assets?.[0] && setNewImage({ uri: r.assets[0].uri!, type: r.assets[0].type!, name: r.assets[0].fileName! }))}>
              <Text style={commonStyles.buttonPrimaryText}>Changer Photo</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, paddingTop: 40 },
  smallBtn: { borderWidth: 1, borderColor: COLORS.border, padding: 5, borderRadius: 5 },
  profileInfo: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE, margin: 0.5, backgroundColor: COLORS.darkGray },
  gridImg: { width: '100%', height: '100%' },
  emptyText: { color: COLORS.gray, textAlign: 'center', marginTop: 50 },
  modalFull: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
});

export default ProfileScreen;
