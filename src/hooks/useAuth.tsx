import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isDemoMode, disableDemo, getDemoProfile, DEMO_USER, DEMO_SESSION } from "@/lib/demo";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  custom_non_negotiables: { id: string; label: string; icon: string }[];
  custom_habits: { id: string; label: string; emoji: string }[];
  consistency_duration_months: number;
  streak_start_date: string;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }

    if (!data) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({ user_id: userId })
        .select("*")
        .single();

      if (insertError) {
        console.error("Failed to create profile:", insertError);
        return null;
      }
      return {
        ...newProfile,
        custom_non_negotiables: (newProfile.custom_non_negotiables ?? []) as Profile["custom_non_negotiables"],
        custom_habits: (newProfile.custom_habits ?? []) as Profile["custom_habits"],
      } as Profile;
    }

    return {
      ...data,
      custom_non_negotiables: (data.custom_non_negotiables ?? []) as Profile["custom_non_negotiables"],
      custom_habits: (data.custom_habits ?? []) as Profile["custom_habits"],
    } as Profile;
  };

  const refreshProfile = async () => {
    if (isDemoMode()) {
      setProfile(getDemoProfile() as Profile);
      return;
    }
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    if (isDemoMode()) {
      setSession(DEMO_SESSION as Session);
      setUser(DEMO_USER as User);
      setProfile(getDemoProfile() as Profile);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(async () => {
            const p = await fetchProfile(session.user.id);
            setProfile(p);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDemoMode()) {
      disableDemo();
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
