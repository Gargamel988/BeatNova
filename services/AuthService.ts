import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username ?? "",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resetPasswordForEmail(
  email: string,
  redirectTo?: string
) {
  const targetRedirect =
    redirectTo ?? `${process.env.EXPO_PUBLIC_API_BASE_URL || "beatnova://reset-password"}`;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: targetRedirect,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
}

export async function getGoogleOAuthUrl(redirectUrl: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function setAuthSession(accessToken: string, refreshToken: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function exchangeCodeForAuthSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  return data;
}
