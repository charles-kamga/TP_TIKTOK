/**
 * TikTok Clone — CommentsScreen.tsx
 * Bottom sheet modal pour afficher les commentaires (comme TikTok)
 * Intégration Firebase pour l'ajout et l'affichage des commentaires
 * Refonte visuelle : styles premium obsidian, poignée (handle), et icônes vectorielles.
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
  Platform,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../config/firebaseconfig';
import { addComment, getCommentsByVideo } from '../services/interactionService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';

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
          <TouchableOpacity style={styles.likeButton} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={15} color={COLORS.lightGray} />
            <Text style={styles.likeCount}>{item.likesCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
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
            {/* Barre de préhension (drag handle) style iOS */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>💬 {comments.length} commentaires</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={COLORS.lightGray} />
              </TouchableOpacity>
            </View>

            {/* Liste des commentaires */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
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
                    <Ionicons name="chatbubbles-outline" size={40} color={COLORS.gray} style={{ marginBottom: 10 }} />
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
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.white} />
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 9999,
  },
  sheet: {
    height: '65%',
    backgroundColor: COLORS.darkObsidian,
    borderTopLeftRadius: BORDER_RADIUS.lg + 4,
    borderTopRightRadius: BORDER_RADIUS.lg + 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...SHADOWS.medium,
    zIndex: 10000,
  },
  container: {
    flex: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
  },
  dragHandle: {
    width: 40,
    height: 4.5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md + 1,
    fontWeight: '700',
  },
  closeButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  commentsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm + 4,
    backgroundColor: COLORS.darkGray,
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
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 1,
  },
  commentText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md - 1,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 1,
    fontWeight: '500',
  },
  replyText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.xs + 1,
    fontWeight: '500',
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
    paddingVertical: 50,
  },
  emptyText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.md - 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.blackDeep,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.darkObsidian,
    borderRadius: 20,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: FONTS.sizes.md - 1,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  sendButton: {
    marginLeft: SPACING.sm + 2,
    backgroundColor: COLORS.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.darkObsidian,
  },
});

export default CommentsScreen;
