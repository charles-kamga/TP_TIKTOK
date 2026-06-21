/**
 * TikTok Clone — ProfileScreen.tsx
 * Dev 6 — Ecran Profil utilisateur
 * Refonte complète du style, des statistiques, du bouton d'édition et du modal.
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
  Pressable,
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../config/firebaseconfig';
import { CLOUDINARY_CONFIG } from '../config/cloudinaryConfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { getUserProfile, updateProfile } from '../services/userService';
import Header from '../components/Header';

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
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 24) / 3;

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
      setNewImage(null);
      setEditModalVisible(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (e) {
      Alert.alert('Erreur de sauvegarde');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loadingProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`@${profile?.username || 'profil'}`}
        rightElement={
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section Infos & Avatar */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: profile?.profilePic || 'https://via.placeholder.com/100' }} 
            style={styles.avatar} 
          />
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{videos.length}</Text>
              <Text style={styles.statLabel}>Vidéos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{profile?.followers || 0}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{profile?.following || 0}</Text>
              <Text style={styles.statLabel}>Abonnements</Text>
            </View>
          </View>
        </View>

        {/* Bio & Details */}
        <View style={styles.bioContainer}>
          <Text style={styles.usernameText}>{profile?.username}</Text>
          <Text style={styles.bioText}>{profile?.bio || 'Pas de bio pour le moment.'}</Text>
        </View>

        {/* Cartes d'actions rapides (Messagerie / Liste utilisateurs) */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('UsersList')}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionCardText}>Utilisateurs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('MessagesList')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.actionCardText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton modifier le profil */}
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)} activeOpacity={0.8}>
          <Ionicons name="pencil-outline" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.editBtnText}>Modifier le profil</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Grille de posts vidéo */}
        {loadingVideos ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={videos}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.gridItem} activeOpacity={0.95}>
                <Image source={{ uri: item.thumbnailUrl || item.videoUrl }} style={styles.gridImg} />
                <View style={styles.gridLikesBadge}>
                  <Ionicons name="heart" size={12} color={COLORS.white} />
                  <Text style={styles.gridLikesText}> {item.likesCount || 0}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.gridContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="videocam-outline" size={40} color={COLORS.gray} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>Aucune vidéo publiée</Text>
              </View>
            }
          />
        )}
      </ScrollView>

      {/* Modal d'édition stylisé en Bottom-Sheet */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)} />
          
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={handleSaveProfile} activeOpacity={0.7}>
                {savingProfile ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.modalSaveText}>OK</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormScroll} keyboardShouldPersistTaps="handled">
              {/* Changement de photo d'avatar */}
              <View style={styles.avatarEditWrapper}>
                <View style={styles.avatarWrapper}>
                  <Image 
                    source={{ uri: newImage?.uri || editProfilePic || 'https://via.placeholder.com/100' }} 
                    style={styles.avatarLarge} 
                  />
                  <TouchableOpacity 
                    style={styles.cameraIconBadge}
                    onPress={() => launchImageLibrary({ mediaType: 'photo' }, r => r.assets?.[0] && setNewImage({ uri: r.assets[0].uri!, type: r.assets[0].type!, name: r.assets[0].fileName! }))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={18} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.changePhotoText}>Changer la photo de profil</Text>
              </View>

              {/* Formulaire */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editUsername} 
                  onChangeText={setEditUsername} 
                  placeholder="Pseudo" 
                  placeholderTextColor={COLORS.gray} 
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput 
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} 
                  value={editBio} 
                  onChangeText={setEditBio} 
                  placeholder="Ajouter une biographie..." 
                  placeholderTextColor={COLORS.gray} 
                  multiline 
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blackDeep,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.blackDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: COLORS.darkGray,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    color: COLORS.white,
    fontSize: FONTS.sizes.xl - 1,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 1,
    marginTop: 4,
  },
  bioContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  usernameText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg - 1,
    fontWeight: '700',
  },
  bioText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.md - 1,
    marginTop: 6,
    lineHeight: 18,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md + 4,
    gap: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkObsidian,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
  },
  actionCardText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
  },
  editBtnText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '700',
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md + 4,
  },
  gridContainer: {
    paddingHorizontal: SPACING.sm,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE * 1.3,
    margin: 4,
    backgroundColor: COLORS.darkObsidian,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
    position: 'relative',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridLikesBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridLikesText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.sm + 1,
  },

  // Modal styling
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalSheet: {
    backgroundColor: COLORS.darkObsidian,
    borderTopLeftRadius: BORDER_RADIUS.lg + 4,
    borderTopRightRadius: BORDER_RADIUS.lg + 4,
    paddingBottom: 30,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  modalCancelText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md + 1,
    fontWeight: '700',
  },
  modalSaveText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  modalFormScroll: {
    padding: SPACING.md,
  },
  avatarEditWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: COLORS.darkGray,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.darkObsidian,
    ...SHADOWS.soft,
  },
  changePhotoText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 2,
    marginTop: 8,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: SPACING.md + 4,
  },
  inputLabel: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 2,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: COLORS.blackDeep,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.sizes.md,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
});

export default ProfileScreen;
