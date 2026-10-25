import { useState } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfil";
import { useTranslation } from "react-i18next";
import {
  getGoogleOAuthUrl,
  setAuthSession,
  exchangeCodeForAuthSession,
  getSession,
} from "@/services/AuthService";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { mutateInsertProfile } = useProfile();

  const createProfileIfNotExists = async () => {
    try {
      const session = await getSession();

      if (!session?.user) {
        return;
      }

      const user = session.user;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        try {
          await mutateInsertProfile.mutateAsync(user);
        } catch (insertError: unknown) {
          const code =
            typeof insertError === "object" && insertError && "code" in insertError
              ? (insertError as { code: unknown }).code
              : "";
          if (code === "23505") {
            return;
          }
          throw insertError;
        }
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : "";
      toast({
        title: t("common.error", "Hata"),
        description:
          msg ||
          t(
            "auth.loginErrorDefault",
            "Profil oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin."
          ),
        variant: "error",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectUrl = Linking.createURL("/");
      const data = await getGoogleOAuthUrl(redirectUrl);

      if (!data?.url) {
        toast({
          title: t("common.error", "Hata"),
          description: t(
            "auth.googleError",
            "Google oturum açma başarısız. Lütfen tekrar deneyin."
          ),
          variant: "error",
        });
        setLoading(false);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: true,
        }
      );

      if (result.type === "cancel" || result.type === "dismiss") {
        setLoading(false);
        return;
      }

      if (result.type === "success" && result.url) {
        const urlParts = result.url.split("#");
        const hashParams = urlParts[1] || "";
        const params = new URLSearchParams(hashParams);
        const code = params.get("code");
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const sessionData = await setAuthSession(access_token, refresh_token);

          if (!sessionData?.session) {
            toast({
              title: t("common.error", "Hata"),
              description: t(
                "auth.googleError",
                "Google oturum açma başarısız. Lütfen tekrar deneyin."
              ),
              variant: "error",
            });
            setLoading(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          await createProfileIfNotExists();
          setLoading(false);
        } else if (code) {
          const sessionData = await exchangeCodeForAuthSession(code);

          if (!sessionData?.session) {
            toast({
              title: t("common.error", "Hata"),
              description: t(
                "auth.googleError",
                "Google oturum açma başarısız. Lütfen tekrar deneyin."
              ),
              variant: "error",
            });
            setLoading(false);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          await createProfileIfNotExists();
          setLoading(false);
        } else {
          toast({
            title: t("common.error", "Hata"),
            description: t(
              "auth.googleError",
              "Google oturum açma başarısız. Lütfen tekrar deneyin."
            ),
            variant: "error",
          });
          setLoading(false);
        }
      }
    } catch {
      toast({
        title: t("common.error", "Hata"),
        description: t(
          "auth.googleError",
          "Google oturum açma başarısız. Lütfen tekrar deneyin."
        ),
        variant: "error",
      });
      setLoading(false);
    }
  };

  return {
    handleGoogleSignIn,
    loading,
  };
}
