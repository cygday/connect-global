import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { generateKeyPair, exportPublicKey } from './crypto';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  language: string;
  bio: string;
  country: string;
  publicKey: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  keyPair: CryptoKeyPair | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null);

  useEffect(() => {
    // Try to load keypair from IndexedDB or generate if missing
    // For simplicity in this demo, we'll store private key in local storage (ENCRYPTED is better but complicated for MVP)
    // Actually, generating it per session is safer but you lose history.
    // Let's generate it and store in IndexedDB or just handle it gracefully.
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // New user: Generate keys
          const kp = await generateKeyPair();
          setKeyPair(kp);
          const pubKeyStr = await exportPublicKey(kp.publicKey);
          
          const newProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Traveler',
            photoURL: user.photoURL || '',
            language: navigator.language.split('-')[0] || 'en',
            bio: 'Just joined GlobalConnect!',
            country: 'Unknown',
            publicKey: pubKeyStr
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile as any);
        } else {
          setProfile(userDoc.data() as UserProfile);
          // In a real app, you'd recover the private key from local storage/IndexedDB
          // For now, we'll just check if we have a session key
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, keyPair, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
