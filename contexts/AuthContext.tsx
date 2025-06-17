import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setUser, clearUser, addBreadcrumb, captureException } from '@/lib/sentry';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserState(session?.user ?? null);
      
      // Set Sentry user context
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
        addBreadcrumb('User session loaded', 'auth', 'info');
      } else {
        clearUser();
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserState(session?.user ?? null);
      
      // Update Sentry user context
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
        addBreadcrumb(`User ${_event}`, 'auth', 'info');
      } else {
        clearUser();
        addBreadcrumb('User signed out', 'auth', 'info');
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      addBreadcrumb('Sign up attempt', 'auth', 'info');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            full_name: fullName,
          },
        },
      });

      if (!error && data.user) {
        // Create user profile
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });
        
        addBreadcrumb('User signed up successfully', 'auth', 'info');
      } else if (error) {
        captureException(new Error(`Sign up failed: ${error.message}`), {
          auth: { email, hasFullName: !!fullName }
        });
      }

      return { error };
    } catch (error) {
      captureException(error as Error, { auth: { operation: 'signUp', email } });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      addBreadcrumb('Sign in attempt', 'auth', 'info');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        captureException(new Error(`Sign in failed: ${error.message}`), {
          auth: { email }
        });
      } else {
        addBreadcrumb('User signed in successfully', 'auth', 'info');
      }
      
      return { error };
    } catch (error) {
      captureException(error as Error, { auth: { operation: 'signIn', email } });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      addBreadcrumb('Sign out attempt', 'auth', 'info');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        captureException(new Error(`Sign out failed: ${error.message}`));
      } else {
        addBreadcrumb('User signed out successfully', 'auth', 'info');
      }
      
      return { error };
    } catch (error) {
      captureException(error as Error, { auth: { operation: 'signOut' } });
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}