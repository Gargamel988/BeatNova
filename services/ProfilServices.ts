import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";
import { User } from "@supabase/supabase-js";

export type Profile = {
  display_name: string;
  bio: string;
  avatar_url: string;
  is_private: boolean;
  show_listening_activity: boolean;
  show_current_song: boolean;
  allow_friend_requests: boolean;
  theme: string;
  is_active?: boolean;
};

export const getProfile = async () => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { data: null, error: null };
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const insertProfile = async (user: User) => {
  if (!user?.id) {
    throw new Error("Kullanıcı oturumu bulunamadı");
  }
  
  // user_name metadata'dan al, yoksa email'den kullanıcı adı oluştur
  const displayName = user.user_metadata?.user_name || 
                      user.user_metadata?.full_name || 
                      user.email?.split('@')[0] || 
                      'Kullanıcı';
  
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: displayName,
      bio: "",
      avatar_url: user.user_metadata?.avatar_url || null,
      theme: "system",
      is_private: false,
      show_listening_activity: true,
      show_current_song: true,
      allow_friend_requests: true,
      is_active: true,
    })
    .select();
    
  if (error) {
    console.error("Profil insert hatası:", error);
    throw error;
  }
  
  return data || [];
};


export const updateCurrentSong = async (songId: string | null) => {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Kullanıcı oturumu bulunamadı");
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      current_song_id: songId,
    })
    .eq("id", user.id)
    .select();
    
  if (error) {
    throw error;
  }
  
  return data;
};

export const updateProfile = async (updates: {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  theme?: string;
  is_private?: boolean;
  show_current_song?: boolean;
  allow_friend_requests?: boolean;
  is_active?: boolean;
}) => {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Kullanıcı oturumu bulunamadı");
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};


export const updateUserActiveStatus = async (isActive: boolean) => {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Kullanıcı oturumu bulunamadı");
  }
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", user.id)
    .select()
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};
