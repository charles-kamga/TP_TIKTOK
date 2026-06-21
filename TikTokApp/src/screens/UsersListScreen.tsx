import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Header from '../components/Header';

const UsersListScreen = ({ navigation }: any) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const videosSnap = await getDocs(collection(db, 'videos'));

        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const videosData = videosSnap.docs.map(doc => doc.data());

        const usersWithStats = usersData.map(user => {
          const userVideos = videosData.filter(v => v.userId === user.id);
          const totalLikes = userVideos.reduce((sum, v) => sum + (v.likesCount || 0), 0);
          return { ...user, totalLikes };
        });

        setUsers(usersWithStats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Header title="Découvrir" showBackButton />

      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={COLORS.lightGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Rechercher un membre..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.lightGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: item.profilePic || 'https://via.placeholder.com/50' }} 
              style={styles.avatar} 
            />
            <View style={styles.info}>
              <Text style={styles.name}>@{item.username}</Text>
              <View style={styles.likesRow}>
                <Ionicons name="heart" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.likes}>{item.totalLikes} j'aime totaux</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={44} color={COLORS.gray} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
      />
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
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONTS.sizes.md + 1,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  card: { 
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
    marginRight: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  info: { 
    flex: 1 
  },
  name: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.md, 
    fontWeight: 'bold' 
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  likes: { 
    color: COLORS.lightGray, 
    fontSize: FONTS.sizes.xs + 2,
    fontWeight: '500',
  },
  centerContainer: { 
    flex: 1, 
    backgroundColor: COLORS.blackDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: COLORS.lightGray,
    fontSize: FONTS.sizes.md - 1,
  },
});

export default UsersListScreen;
