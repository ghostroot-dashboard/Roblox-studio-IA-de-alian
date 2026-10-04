import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { FirestoreService } from '../services/firestoreService';
import { UserProfile, Project } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  currentProject: Project | null;
  setCurrentProject: (proj: Project | null) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [error, setError] = useState<string | null>(null);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sf_theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem('sf_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile: UserProfile = {
            uid: user.uid,
            email: user.email || 'developer@roblox.com',
            displayName: user.displayName || 'Roblox Creator',
            photoURL: user.photoURL || undefined,
            theme: savedTheme,
            createdAt: new Date().toISOString(),
          };
          await FirestoreService.syncUserProfile(profile);
          setUserProfile(profile);
        } catch (e) {
          console.error('Error syncing profile:', e);
        }
      } else {
        setUserProfile(null);
        setCurrentProject(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana emergente. Por favor, habilítala para iniciar sesión.');
      } else {
        setError('No se pudo iniciar sesión con Google. Por favor, intenta de nuevo.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentProject(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        logout,
        currentProject,
        setCurrentProject,
        theme,
        setTheme,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
