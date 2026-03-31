import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have PLACEHOLDER API key, simulate auth state to false (needs login)
    if (auth.app.options.apiKey?.includes('PLACEHOLDER')) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    // Override para credencial administrativa temporária
    if (email === 'admin@prisma.com' && pass === 'senha123') {
      setUser({ email, uid: 'admin-mock-id', displayName: 'Administrador PRISMA' } as User);
      return;
    }

    if (auth.app.options.apiKey?.includes('PLACEHOLDER')) {
      // Mock successful login
      setUser({ email, uid: 'mock-user-id', displayName: 'Usuário Teste' } as User);
      return;
    }
    await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
