import { db } from '../config/firebaseconfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

/**
 * POST : Ajouter un commentaire sur une vidéo
 */
export const addComment = async (
  videoId: string,
  userData: { userId: string; username: string; profilePic: string },
  text: string,
) => {
  if (!text.trim()) return;

  try {
    const commentsRef = collection(db, 'videos', videoId, 'comments');

    const newCommentDoc = await addDoc(commentsRef, {
      userId: userData.userId,
      username: userData.username,
      profilePic: userData.profilePic,
      text: text,
      createdAt: serverTimestamp(),
      likesCount: 0,
    });

    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      commentsCount: increment(1),
    });

    return newCommentDoc.id;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire :', error);
    throw error;
  }
};

/**
 * GET : Récupérer les commentaires d'une vidéo
 */
export const getCommentsByVideo = async (videoId: string) => {
  try {
    const commentsRef = collection(db, 'videos', videoId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const comments: Array<{ id: string; [key: string]: unknown }> = [];
    querySnapshot.forEach((commentDoc) => {
      comments.push({
        id: commentDoc.id,
        ...commentDoc.data(),
      });
    });

    return comments;
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires :', error);
    throw error;
  }
};

/**
 * POST : Liker une vidéo
 */
export const likeVideo = async (videoId: string, userId: string) => {
  try {
    const likeRef = doc(db, 'videos', videoId, 'likes', userId);

    await setDoc(likeRef, {
      likedAt: serverTimestamp(),
    });

    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      likesCount: increment(1),
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du Like :', error);
    throw error;
  }
};

/**
 * DELETE : Retirer un Like
 */
export const unlikeVideo = async (videoId: string, userId: string) => {
  try {
    const likeRef = doc(db, 'videos', videoId, 'likes', userId);
    await deleteDoc(likeRef);

    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      likesCount: increment(-1),
    });   
  } catch (error) {
    console.error('Erreur lors de la suppression du Like :', error);
    throw error;
  }
};