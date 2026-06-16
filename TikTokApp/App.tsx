/**
 * TikTok Clone — App.tsx
 * Chef de projet : Patricia
 * Point d'entree principal de l'application
 */
import { COLORS } from './src/styles/theme';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebaseconfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

// Loading screen
import LoadingScreen from './src/screens/LoadingScreen';



GoogleSignin.configure({
    webClientId: "340558321578-hgeokglas04e48ruovbe52kh4pi23etv.apps.googleusercontent.com",
    offlineAccess: false,
  });

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Ecouter les changements d'etat d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Nettoyage quand le composant se demonte
    return () => unsubscribe();
  }, []);

  // Afficher un ecran de chargement pendant la verification auth
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <NavigationContainer>
        {user ? (
          // Utilisateur connecte -> ecrans principaux
          <AppNavigator />
        ) : (
          // Utilisateur non connecte -> ecrans d'authentification
          <AuthNavigator />
        )}
      </NavigationContainer>
    </>
  );
};

export default App;
