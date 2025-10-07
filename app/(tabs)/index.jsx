import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { arrayUnion, doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator, Alert, Image,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebase';

export default function AuthPage() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [user] = useAuthState(auth);

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState('caregiver');
  const [inviteCode, setInviteCode] = useState('');

  const db = getFirestore();

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      return Alert.alert('Error', 'Please fill all fields.');
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleRegister = async () => {
    if (!registerName || !registerEmail || !registerPassword) {
      return Alert.alert('Error', 'Please fill all fields.');
    }

    if ((role === 'child' || role === 'teacher') && !inviteCode.trim()) {
      return Alert.alert('Invite Required', 'Please enter the caregiver invite code.');
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const uid = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: registerName,
      });

      if (role === 'child' || role === 'teacher') {
        // validate invite
        const inviteRef = doc(db, 'invites', inviteCode.trim());
        const caregiverSnap = await getDoc(inviteRef);

        if (!caregiverSnap.exists()) {
          setIsLoading(false);
          return Alert.alert('Invalid Code', 'This invite code does not exist.');
        }

        const caregiverId = caregiverSnap.data().caregiverId;

        // create child or teacher user
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: registerName,
          email: registerEmail,
          role,
          caregiverId,
        });

        // link child/teacher to caregiver
        const updateField = role === 'child' ? 'childs' : 'teachers';
        await updateDoc(doc(db, 'users', caregiverId), {
          [updateField]: arrayUnion(uid),
        });
      } else {
        // caregiver only
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: registerName,
          email: registerEmail,
          role,
          childs: [],
          teachers: [],
        });
      }

      setIsLoading(false);
      Alert.alert('Success', 'Account created successfully.');
      navigation.replace('Drawer');
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        isDarkMode && { backgroundColor: '#121212' },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>
          Welcome to My Day Pal
        </Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setMode('login')}
            style={[styles.tab, mode === 'login' && styles.activeTabBackground]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('register')}
            style={[styles.tab, mode === 'register' && styles.activeTabBackground]}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Forms */}
        {mode === 'login' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="name@example.com"
              style={styles.input}
              value={loginEmail}
              onChangeText={setLoginEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
              value={loginPassword}
              onChangeText={setLoginPassword}
            />
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="Enter your name"
              style={styles.input}
              value={registerName}
              onChangeText={setRegisterName}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              style={styles.input}
              value={registerEmail}
              onChangeText={setRegisterEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.input}
              value={registerPassword}
              onChangeText={setRegisterPassword}
            />

            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleContainer}>
              {['caregiver', 'teacher'].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.roleOption, role === r && styles.selectedRole]}
                >
                  <Text style={styles.roleText}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(role === 'child' || role === 'teacher') && (
              <>
                <Text style={styles.label}>Caregiver Invite Code</Text>
                <TextInput
                  placeholder="Enter invite code"
                  style={styles.input}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                />
              </>
            )}

            <TouchableOpacity
              onPress={handleRegister}
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  logoContainer: { alignItems: 'center' },
  logo: { width: 100, height: 100 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabBackground: { backgroundColor: '#e6f0ff' },
  tabText: { fontSize: 12, color: '#6c757d', fontWeight: '600' },
  activeTabText: { color: '#007bff' },
  label: { marginBottom: 4, fontWeight: '500', color: '#212529' },
  form: { marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ced4da',
    color: 'grey',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedRole: { backgroundColor: '#e6f0ff', borderColor: '#007bff' },
  roleText: { fontSize: 12, fontWeight: '500' },
});
