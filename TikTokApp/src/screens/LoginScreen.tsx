/**
 * TikTok Clone — LoginScreen.tsx
 * PLACEHOLDER — A completer par Dev 2
 * Ce fichier est cree par le chef de projet pour que
 * la navigation fonctionne des le debut
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID } from '@env';

// Configure Google Sign-In une seule fois au chargement du module
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID, // Le Web Client ID (type 3) de ton google-services.json
  offlineAccess: true,          // Nécessaire pour obtenir un idToken pour Firebase
});
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

const getFirebaseErrorMessage = (code: string): string => {
  const errors: Record<string, string> = {
    'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifie ta connexion.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  };
  return errors[code] || 'Une erreur est survenue. Réessaie.';
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Remplis tous les champs.');
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      // AJOUTEZ CETTE LIGNE DE LOG :
      console.log("Erreur d'authentification détaillée :", err);

      setError(getFirebaseErrorMessage(err.code));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      
      // 2. Vérifier la disponibilité des Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // 3. Déclencher l'ouverture de la fenêtre Google
      const signInResult = await GoogleSignin.signIn();
      
      // Récupérer le jeton (compatible v12 et v13 de la bibliothèque)
      const idToken = signInResult.idToken || (signInResult as any).data?.idToken;

      if (!idToken) {
        throw new Error("Impossible de récupérer le jeton d'authentification Google.");
      }

      // 4. Créer l'identifiant Firebase avec le jeton d'accès Google
      const credential = GoogleAuthProvider.credential(idToken);

      // 5. Connecter l'utilisateur sur Firebase
      await signInWithCredential(auth, credential);
      
    } catch (err: any) {
      console.log("Erreur Google Sign-In détaillée :", err);
      if (err.code === 'SIGN_IN_CANCELLED') {
        setError('Connexion annulée par l’utilisateur.');
      } else if (err.code === 'IN_PROGRESS') {
        setError('Connexion Google déjà en cours...');
      } else {
        setError('Échec de la connexion avec Google. Réessaye.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.logoContainer}>
          <Image
            source={require('../../Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Content de te revoir 👋</Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Ton mot de passe"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Se connecter</Text>}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>S'inscrire</Text>
          </TouchableOpacity>
        </View>

       {/* AJOUT : Bouton Google */}
       <TouchableOpacity
         style={[styles.googleButton, loading && styles.buttonDisabled]}
         onPress={handleGoogleLogin}
         disabled={loading}
         activeOpacity={0.85}
       >
         <Text style={styles.googleButtonText}>🔴 Se connecter avec Google</Text>
       </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl + SPACING.lg, paddingBottom: SPACING.xl },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoImage: { width: 160, height: 80 },
  tagline: { fontSize: FONTS.sizes.md, color: COLORS.lightGray, marginTop: SPACING.xs },
  form: { gap: SPACING.md },
  inputWrapper: { marginBottom: SPACING.xs },
  label: { color: COLORS.lightGray, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: COLORS.darkGray, color: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: FONTS.sizes.lg, borderWidth: 1, borderColor: COLORS.border },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeBtn: { backgroundColor: COLORS.darkGray, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 0, borderTopRightRadius: BORDER_RADIUS.lg, borderBottomRightRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 14 },
  eyeText: { fontSize: FONTS.sizes.xl },
  errorBox: { backgroundColor: '#1a0000', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderLeftWidth: 3, borderLeftColor: COLORS.error },
  errorText: { color: '#ff6b81', fontSize: FONTS.sizes.sm, lineHeight: 18 },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, elevation: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.lightGray, fontSize: FONTS.sizes.md },
  linkText: { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: '700' },
  googleButton: {
    backgroundColor: COLORS.white, // Bouton blanc pour trancher sur le thème noir
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    color: COLORS.black, // Texte noir
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
});

export default LoginScreen;