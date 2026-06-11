import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

// Vos paramètres de configuration Cloudinary existants
const CLOUDINARY_CLOUD_NAME = 'dmuwi00uj';
const CLOUDINARY_UPLOAD_PRESET = 't1ahbbgz'; // preset pour les vidéos

const UploadScreen = ({ navigation }: any) => {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape 1 : Sélectionner la vidéo de la galerie
  const selectVideo = () => {
    launchImageLibrary(
      {
        mediaType: 'video',
        videoQuality: 'high',
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorMessage) {
          Alert.alert('Erreur', response.errorMessage);
          return;
        }

        const asset = response.assets?.[0];
        if (asset && asset.uri) {
          setVideoUri(asset.uri);
          setVideoType(asset.type || 'video/mp4');
          setVideoName(asset.fileName || 'upload_video.mp4');
        }
      }
    );
  };

  // Étape 2 : Envoyer sur Cloudinary, puis sauvegarder dans Firestore
  const handlePublish = async () => {
    if (!videoUri) {
      Alert.alert('Attention', 'Veuillez d’abord sélectionner une vidéo.');
      return;
    }

    setLoading(true);

    try {
      // 1. Préparation du FormData pour Cloudinary
      const data = new FormData();
      data.append('file', {
        uri: Platform.OS === 'android' ? videoUri : videoUri.replace('file://', ''),
        type: videoType,
        name: videoName,
      } as any);
      data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // 2. Envoi de la vidéo vers l'API REST de Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: data,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Échec de l'envoi sur Cloudinary");
      }

      // L'URL de la vidéo renvoyée par Cloudinary
      const videoUrl = result.secure_url;

      // 3. Récupérer l'utilisateur connecté
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Utilisateur non connecté.');
      }

      // 4. Enregistrement des détails dans Firestore
      await addDoc(collection(db, 'videos'), {
        userId: currentUser.uid,
        videoUrl: videoUrl,
        description: description.trim(),
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Votre vidéo a été publiée avec succès ! 🎉', [
        {
          text: 'Super !',
          onPress: () => {
            // Réinitialiser les états et rediriger vers l'écran d'accueil
            setVideoUri(null);
            setDescription('');
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur de publication', error.message || 'Une erreur est survenue lors de l’upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un Post 🎥</Text>

        {/* Zone de sélection de vidéo */}
        <TouchableOpacity style={styles.uploadArea} onPress={selectVideo} activeOpacity={0.8}>
          {videoUri ? (
            <View style={styles.selectedContainer}>
              <Text style={styles.icon}>✅</Text>
              <Text style={styles.selectedText}>Vidéo sélectionnée !</Text>
              <Text style={styles.fileName}>{videoName}</Text>
              <Text style={styles.changeBtnText}>Changer de vidéo</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.icon}>📤</Text>
              <Text style={styles.placeholderText}>Sélectionner une vidéo</Text>
              <Text style={styles.placeholderSub}>Format MP4 recommandé</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Champ Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Écrivez une légende captivante pour votre vidéo..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            maxLength={150}
          />
          <Text style={styles.charCount}>{description.length}/150</Text>
        </View>

        {/* Bouton de publication */}
        <TouchableOpacity
          style={[styles.publishButton, (!videoUri || loading) && styles.disabledButton]}
          onPress={handlePublish}
          disabled={!videoUri || loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.publishButtonText}> Publication en cours...</Text>
            </View>
          ) : (
            <Text style={styles.publishButtonText}>Publier la vidéo</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  uploadArea: {
    height: 220,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  placeholderContainer: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  selectedContainer: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  placeholderSub: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.sm,
    marginTop: 5,
  },
  selectedText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
  },
  fileName: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.md,
    marginTop: 5,
    textAlign: 'center',
  },
  changeBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.md,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.darkGray,
    color: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    height: 100,
    textAlignVertical: 'top',
    fontSize: FONTS.sizes.md,
  },
  charCount: {
    color: COLORS.gray,
    fontSize: FONTS.sizes.sm,
    textAlign: 'right',
    marginTop: 5,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: COLORS.darkGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  publishButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UploadScreen;