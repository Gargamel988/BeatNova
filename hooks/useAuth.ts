import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfil";

export const useAuth = () => {
  const { mutateInsertProfile } = useProfile();

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  };


  const register = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: username,
        },
      },
    });


    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error("Kullanıcı oluşturulamadı");
    }

    try {
      await mutateInsertProfile.mutateAsync(data.user);
    } catch {
      throw new Error("Profil oluşturulurken bir hata oluştu");
    }
    
    return data;
  };


  const logout = async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };
  
  return { login, logout, register };
};
