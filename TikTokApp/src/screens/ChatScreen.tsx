import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../config/firebaseconfig';
import { sendMessage, subscribeToMessages, getChatId } from '../services/chatService';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Header from '../components/Header';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

const ChatScreen = ({ route, navigation }: any) => {
  const { receiverId, receiverName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const chatId = getChatId(currentUser.uid, receiverId);
    const unsubscribe = subscribeToMessages(chatId, (messagesData: any[]) => {
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [receiverId, currentUser]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser) return;

    try {
      const chatId = getChatId(currentUser.uid, receiverId);
      await sendMessage(chatId, inputText.trim(), currentUser.uid);
      setInputText('');
    } catch (error) {
      console.error('Erreur d’envoi :', error);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Header title={`@${receiverName}`} showBackButton />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Envoyer un message..."
            placeholderTextColor={COLORS.lightGray}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep 
  },
  messagesList: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.md 
  },
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: SPACING.sm + 4 
  },
  myRow: { 
    justifyContent: 'flex-end' 
  },
  otherRow: { 
    justifyContent: 'flex-start' 
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '75%',
    ...SHADOWS.soft,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4, // Coin asymétrique pointu
  },
  otherBubble: {
    backgroundColor: COLORS.darkObsidian,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4, // Coin asymétrique pointu
  },
  messageText: { 
    fontSize: FONTS.sizes.md - 1, 
    lineHeight: 20 
  },
  myText: { 
    color: COLORS.white, 
    fontWeight: '500' 
  },
  otherText: { 
    color: COLORS.white 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.blackDeep,
    marginBottom: Platform.OS === 'ios' ? 10 : 0,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.darkObsidian,
  },
});

export default ChatScreen;