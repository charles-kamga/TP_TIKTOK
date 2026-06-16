/**
 * TikTok Clone — RegisterScreen.tsx
 * PLACEHOLDER — A completer par Dev 2
 * Ce fichier est cree par le chef de projet pour que
 * la navigation fonctionne des le debut
 */

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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebaseconfig';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../styles/theme';

const getFirebaseErrorMessage = (code: string): string => {
  const errors: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/operation-not-allowed': 'Inscription désactivée. Contacte le support.',
    'auth/network-request-failed': 'Erreur réseau. Vérifie ta connexion.',
  };
  return errors[code] || 'Une erreur est survenue. Réessaie.';
};

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleRegister = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Remplis tous les champs.');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      triggerShake();
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: '',
        bio: '',
        avatarUrl: '',
        followers: 0,
        following: 0,
        likes: 0,
        createdAt: serverTimestamp(),
      });

      navigation.replace('Home');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
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
          <Text style={styles.tagline}>Crée ton compte</Text>
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
                placeholder="Min. 6 caractères"
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

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Répète ton mot de passe"
              placeholderTextColor={COLORS.gray}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Se connecter</Text>
          </TouchableOpacity>
        </View>

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
});

export default RegisterScreen;