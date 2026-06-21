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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Header from '../components/Header';

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
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const searchLower = text.toLowerCase();
      const filteredUsers: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
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

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
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
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Header title="Rechercher" showBackButton />

      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.lightGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un pseudo..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={performSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.lightGray} />
            </TouchableOpacity>
          )}
        </View>
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
                <Ionicons name="people-outline" size={44} color={COLORS.gray} style={{ marginBottom: 10 }} />
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep 
  },
  searchBarWrapper: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  searchBarContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkObsidian, 
    borderRadius: BORDER_RADIUS.lg, 
    paddingHorizontal: SPACING.md, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONTS.sizes.md + 1,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  list: { 
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  userCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.darkObsidian, 
    padding: 12, 
    borderRadius: BORDER_RADIUS.md, 
    marginBottom: 10, 
    borderWidth: 0.5, 
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: { 
    flex: 1 
  },
  username: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.md, 
    fontWeight: '700' 
  },
  bio: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.xs + 2, 
    marginTop: 4 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 40 
  },
  emptyText: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.md - 1 
  },
});

export default SearchUsersScreen;