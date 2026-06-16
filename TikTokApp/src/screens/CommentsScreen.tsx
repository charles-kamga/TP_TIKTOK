/**
 * TikTok Clone — CommentsScreen.tsx
 * Bottom sheet modal pour afficher les commentaires (comme TikTok)
 * Intégration Firebase pour l'ajout et l'affichage des commentaires
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';
import { addComment, getCommentsByVideo } from '../services/interactionService';
import { COLORS } from '../styles/theme';

interface CommentsScreenProps {
  videoId: string;
  visible: boolean;
  onClose: () => void;
}

const CommentsScreen = ({ videoId, visible, onClose }: CommentsScreenProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les commentaires au montage ou quand videoId change
  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await getCommentsByVideo(videoId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;

    try {
      setIsSubmitting(true);

      // 1. Récupérer le vrai document de l'utilisateur dans Firestore (users/{uid})
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let username = 'Anonyme';
      let profilePic = 'https://via.placeholder.com/32';

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();

        // On récupère le vrai pseudo ou on se replie sur Firebase Auth
        username = data.username || auth.currentUser.displayName || 'Utilisateur';

        // CORRECTIF D'INCOHÉRENCE : On accepte indifféremment 'profilePic' ou 'avatarUrl'
        profilePic = data.profilePic || data.avatarUrl || auth.currentUser.photoURL || 'https://via.placeholder.com/32';
      } else {
        // Repli de secours si l'utilisateur n'a pas encore de document Firestore
        username = auth.currentUser.displayName || 'Utilisateur';
        profilePic = auth.currentUser.photoURL || 'https://via.placeholder.com/32';
      }

      const userData = {
        userId: auth.currentUser.uid,
        username,
        profilePic,
      };

      // 2. Envoi du commentaire
      await addComment(videoId, userData, newComment);
      setNewComment('');

      // 3. Recharger la liste
      await loadComments();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (firebaseTimestamp: any) => {
    if (!firebaseTimestamp) return 'À l\'instant';
    
    const now = new Date();
    const commentDate = firebaseTimestamp.toDate?.() || new Date(firebaseTimestamp);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j`;
  };

  const renderComment = ({ item }: any) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.profilePic }} style={styles.avatar} />
      <View style={styles.commentContent}>
        <View style={styles.headerRow}>
          <Text style={styles.author}>{item.username}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.likeButton}>
            <Text style={styles.likeIcon}>❤️</Text>
            <Text style={styles.likeCount}>{item.likesCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.replyText}>Répondre</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* 1. Conteneur principal qui aligne la sheet en bas */}
      <View style={styles.modalRoot}>
        
        {/* 2. Le fond semi-transparent absolu (cliquable pour fermer) */}
        <Pressable style={styles.absoluteOverlay} onPress={onClose} />
        
        {/* 3. La feuille de commentaires */}
        <View style={styles.sheet}>
          <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💬 {comments.length} commentaires</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des commentaires */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        ) : (
          <FlatList
            data={comments}
            style={styles.commentsList}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            scrollEnabled={true}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun commentaire pour le moment</Text>
              </View>
            }
          />
        )}

        {/* Input pour ajouter un commentaire */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={COLORS.lightGray}
            value={newComment}
            onChangeText={setNewComment}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
  },
  sheet: {
    height: '65%',
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 10000,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    color: COLORS.lightGray,
    fontSize: 18,
    padding: 4,
  },
  commentsList: {
    flex: 1, // FORCE la liste à ne pas dépasser l'espace disponible
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  author: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.lightGray,
    fontSize: 12,
  },
  commentText: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    fontSize: 16,
  },
  likeCount: {
    color: COLORS.lightGray,
    fontSize: 12,
  },
  replyText: {
    color: COLORS.lightGray,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 20,
    color: COLORS.primary, // Donne une couleur (rose TikTok) pour la visibilité
  },
});

export default CommentsScreen;
