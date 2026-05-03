import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
      toast.error('Failed to sign in.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-sumi-800 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-[3px] border-cinnabar-100 border-t-cinnabar-500 rounded-full animate-spin mb-4" />
        <p className="text-ink-400 dark:text-sumi-300 font-semibold text-sm">Loading FluentCards...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream dark:bg-sumi-800 text-ink-700 dark:text-sumi-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-8 left-8 w-40 h-40 bg-cinnabar-100/40 dark:bg-cinnabar-900/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-8 w-40 h-40 bg-gold-100/30 dark:bg-gold-900/20 rounded-full blur-2xl"></div>
        <div className="absolute text-[12rem] font-display font-bold text-cream-200/50 dark:text-sumi-700/40 bottom-4 right-4 select-none leading-none pointer-events-none">学</div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-cinnabar-500 rounded-xl flex items-center justify-center shadow-lg shadow-cinnabar-200/50 dark:shadow-cinnabar-900/30 mb-5">
            <span className="font-display font-bold text-white text-3xl">FC</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2 text-ink-800 dark:text-sumi-50 tracking-tight">FluentCards</h1>
          <p className="text-ink-500 dark:text-sumi-300 font-semibold mb-10 max-w-md text-center text-base">Your flashcard companion for learning languages effectively.</p>

          <Button onClick={signInWithGoogle} size="lg" className="flex items-center gap-3 bg-white dark:bg-sumi-700 text-ink-700 dark:text-sumi-100 hover:bg-cream dark:hover:bg-sumi-600 border-2 border-parchment-200 dark:border-sumi-600 shadow-sm rounded-xl h-14 px-8 font-bold text-base">
            <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.369 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.109 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
