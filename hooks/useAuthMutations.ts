import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { resetPasswordForEmail } from "@/services/AuthService";
import { getAuthErrorInfo } from "@/utils/authErrors";
import { queryKeys } from "@/constants/queryKeys";
import type { LoginSchemeType } from "@/schemes/LoginScheme";
import type { RegisterSchemeType } from "@/schemes/RegisterScheme";

export function useLoginMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginSchemeType) => {
      return await login(data.email, data.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      toast({
        title: t("auth.loginSuccess", "Giriş Başarılı"),
        description: t("auth.loginSuccessDesc", "Giriş başarılı bir şekilde yapıldı"),
        variant: "success",
      });
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      const { title, description } = getAuthErrorInfo(error, t);
      toast({
        title,
        description,
        variant: "error",
      });
    },
  });
}

export function useRegisterMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { register } = useAuth();

  return useMutation({
    mutationFn: async (data: RegisterSchemeType) => {
      return await register(data.email, data.password, data.username);
    },
    onSuccess: () => {
      toast({
        title: t("common.ok", "Başarılı"),
        description: t("auth.registerSuccessDesc", "Hesabınız başarıyla oluşturuldu"),
        variant: "success",
        duration: 3000,
      });
      onSuccessCallback?.();
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1000);
    },
    onError: (error: unknown) => {
      const { title, description } = getAuthErrorInfo(error, t);
      toast({
        title,
        description,
        variant: "error",
        duration: 3000,
      });
    },
  });
}

export function useForgotPasswordMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (email: string) => {
      return await resetPasswordForEmail(email);
    },
    onSuccess: () => {
      toast({
        title: t("common.ok", "Başarılı"),
        description: t(
          "auth.forgotPasswordSubtitle",
          "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
        ),
        variant: "success",
      });
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      const { title, description } = getAuthErrorInfo(error, t);
      toast({
        title,
        description: description || t("auth.loginErrorDefault", "Şifre sıfırlama e-postası gönderilemedi"),
        variant: "error",
      });
    },
  });
}

export function useLogoutMutation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace("/(auth)/login");
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error", "Hata"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "error",
      });
    },
  });
}
