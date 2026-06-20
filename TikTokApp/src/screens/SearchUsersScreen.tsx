import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

const SearchUsersScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // 1. On récupère la collection entière (très léger pour un TP)
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const searchLower = text.toLowerCase();
      const filteredUsers: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 2. Vérification sur le username en ignorant la casse (toLower)
        const username = (data.username || '').toLowerCase();
        
        if (username.includes(searchLower)) {
          filteredUsers.push({ id: doc.id, ...data });
        }
      });

      setResults(filteredUsers);
    } catch (error) {
      console.error('Erreur recherche :', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Image
        source={{ uri: item.profilePic || item.avatarUrl || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username || 'utilisateur'}</Text>
        {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
      <Text style={styles.arrow}>❯</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher 🔍</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur par pseudo..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={performSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchQuery.trim() ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>Aucun utilisateur trouvé 😕</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  searchBarContainer: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { backgroundColor: COLORS.darkGray, color: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.border },
  list: { paddingHorizontal: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: BORDER_RADIUS.lg, marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  userInfo: { flex: 1 },
  username: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  bio: { color: COLORS.lightGray, fontSize: 13, marginTop: 4 },
  arrow: { color: COLORS.gray, fontSize: 16, marginRight: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: COLORS.lightGray, fontSize: 14 },
});

export default SearchUsersScreen;