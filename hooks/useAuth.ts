import { useProfile } from "@/hooks/useProfil";
import { signInWithEmail, signUpWithEmail, signOut } from "@/services/AuthService";

export const useAuth = () => {
  const { mutateInsertProfile } = useProfile();

  const login = async (email: string, password: string) => {
    return await signInWithEmail(email, password);
  };

  const register = async (email: string, password: string, username: string) => {
    const data = await signUpWithEmail(email, password, username);

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
    await signOut();
  };

  return { login, logout, register };
};
