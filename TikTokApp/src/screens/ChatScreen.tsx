import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { getChatId, sendMessage, subscribeToMessages } from '../services/chatService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

const ChatScreen = ({ route, navigation }: any) => {
  // On s'attend à recevoir l'ID et le nom du destinataire via les paramètres de navigation
  const { receiverId, receiverName } = route.params || { receiverId: 'test_uid', receiverName: 'Utilisateur' };
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const currentUser = auth.currentUser;

  // Écouter les messages en temps réel avec le nouveau service
  useEffect(() => {
    if (!currentUser) return;

    const chatId = getChatId(currentUser.uid, receiverId);
    const unsubscribe = subscribeToMessages(chatId, (messages) => {
      setMessages(messages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [receiverId]);

  // Envoyer un message avec le nouveau service
  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const chatId = getChatId(currentUser.uid, receiverId);
      await sendMessage(chatId, textToSend, currentUser.uid);
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
    }
  };

  const renderMessageItem = ({ item }: any) => {
    const isMyMessage = item.senderId === currentUser?.uid;

    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myRow : styles.theirRow]}>
        <View style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}>
          <Text style={isMyMessage ? styles.myText : styles.theirText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header personnalisé */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>◀ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 {receiverName}</Text>
        <View style={{ width: 60 }} /> {/* Équilibre le bouton retour */}
      </View>

      {/* Zone des messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message. Dites bonjour ! 👋</Text>
            </View>
          }
        />
      )}

      {/* Saisie du message */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor={COLORS.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  backButton: { paddingVertical: 4 },
  backText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 12, width: '100%' },
  myRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: BORDER_RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: COLORS.darkGray, borderBottomLeftRadius: 2 },
  myText: { color: COLORS.white, fontSize: 15, fontWeight: '500' },
  theirText: { color: COLORS.white, fontSize: 15, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.lightGray, fontSize: 14, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: COLORS.border, backgroundColor: '#111' },
  input: { flex: 1, backgroundColor: COLORS.darkGray, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: COLORS.white, fontSize: 15, maxHeight: 100 },
  sendButton: { marginLeft: 12, backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sendButtonDisabled: { backgroundColor: COLORS.darkGray, opacity: 0.5 },
  sendText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});

export default ChatScreen;