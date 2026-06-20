// src/services/userService.ts
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

/**
 * Initialise un profil utilisateur lors de l'inscription
 */
export const createUserProfile = async (uid: string, email: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const initialData = {
      uid,
      email,
      username: '',
      bio: '',
      profilePic: '',
      avatarUrl: '', // Doublon pour compatibilité
      followers: 0,
      following: 0,
      likes: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, initialData);
    return initialData;
  } catch (error) {
    console.error("Erreur lors de la création du profil :", error);
    throw error;
  }
};

/**
 * Récupère le profil d'un utilisateur depuis Firestore
 */
export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    throw error;
  }
};

/**
 * Met à jour le profil d'un utilisateur avec nettoyage automatique des données
 */
export const updateProfile = async (uid: string, data: { username?: string, bio?: string, profilePic?: string }) => {
  try {
    const userRef = doc(db, 'users', uid);

    // Nettoyage automatique des données pour éviter les 'undefined' et sécuriser Firestore
    const cleanData = {
      uid: uid,
      username: (data.username || '').trim(),
      bio: (data.bio || '').trim(),
      profilePic: (data.profilePic || '').trim(),
      avatarUrl: (data.profilePic || '').trim(), // Pour la compatibilité avec la recherche
    };

    await setDoc(userRef, cleanData, { merge: true });
    return cleanData;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    throw error;
  }
};
