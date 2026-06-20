import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseconfig';
import { COLORS } from '../styles/theme';

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

  // Filtrage dynamique (en temps réel sur la liste déjà chargée) - MUST be before conditional return
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  if (loading) return <ActivityIndicator style={styles.center} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      {/* Barre de recherche intégrée */}
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher un utilisateur..."
        placeholderTextColor={COLORS.gray}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          >
            <Image source={{ uri: item.profilePic || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <View style={styles.info}>
              <Text style={styles.name}>@{item.username}</Text>
              <Text style={styles.likes}>❤️ {item.totalLikes} likes totaux</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black, padding: 16 },
  searchBar: {
    backgroundColor: '#1a1a1a',
    color: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  info: { flex: 1 },
  name: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  likes: { color: COLORS.lightGray, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center' }
});

export default UsersListScreen;
