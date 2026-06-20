import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseconfig';

/**
 * Génère un ID de chat unique basé sur les deux IDs d'utilisateurs
 * Trie les IDs par ordre alphabétique et les concatène
 * Exemple: uid1="abc", uid2="xyz" -> "abc_xyz"
 */
export const getChatId = (uid1: string, uid2: string): string => {
  const sortedIds = [uid1, uid2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

/**
 * Envoie un message dans une room de chat
 * - Ajoute le message dans la sous-collection messages
 * - Met à jour le champ lastMessage et updatedAt dans le document de la room
 */
export const sendMessage = async (
  chatId: string,
  text: string,
  senderId: string
): Promise<void> => {
  try {
    // 1. Ajouter le message dans la sous-collection
    const messagesRef = collection(db, 'rooms', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
    });

    // 2. Mettre à jour le document de la room
    const roomRef = doc(db, 'rooms', chatId);
    const roomDoc = await getDoc(roomRef);

    if (roomDoc.exists()) {
      await updateDoc(roomRef, {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Si la room n'existe pas, la créer
      const participants = chatId.split('_');
      await setDoc(roomRef, {
        id: chatId,
        participants,
        lastMessage: text,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

/**
 * S'abonne aux messages d'une room en temps réel
 * Utilise onSnapshot pour recevoir les messages en temps réel
 * Retourne une fonction de désabonnement
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: any[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'rooms', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error('Erreur lors de l\'écoute des messages:', error);
    }
  );

  return unsubscribe;
};

/**
 * S'abonne à la liste des rooms de l'utilisateur en temps réel
 * Retourne une fonction de désabonnement
 */
export const subscribeToUserRooms = (
  userId: string,
  callback: (rooms: any[]) => void
): (() => void) => {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const rooms = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((room: any) => room.participants?.includes(userId));
      callback(rooms);
    },
    (error) => {
      console.error('Erreur lors de l\'écoute des rooms:', error);
    }
  );

  return unsubscribe;
};
