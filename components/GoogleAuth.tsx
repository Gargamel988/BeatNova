import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { useToast } from "./ui/toast";
import { useResponsive } from "@/hooks/useResponsive";
import { supabase } from "@/lib/supabase";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useProfile } from "@/hooks/useProfil";

WebBrowser.maybeCompleteAuthSession();

const GoogleSignIn = ({ text }: { text: string }) => {
  const { toast } = useToast();
  const { radius, fontSize, hp } = useResponsive();
  const [loading, setLoading] = useState(false);
  const { palette } = useThemeModeContext();
  const { mutateInsertProfile } = useProfile();
  // Profil kontrolü ve oluşturma fonksiyonu
  const createProfileIfNotExists = async () => {
    try {
      // Session'dan user'ı al
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.warn("Session bulunamadı:", sessionError);
        return;
      }

      const user = session.user;

      // Profil var mı kontrol et
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      // Profil yoksa oluştur
      if (!profile) {
        if (profileError) {
          console.error("Profil kontrolü hatası:", profileError);
          // Hata varsa bile devam et, belki profil gerçekten yoktur
        }
        
        try {
          await mutateInsertProfile.mutateAsync(user);
        } catch (insertError: any) {
          // Eğer profil zaten varsa (race condition), sessizce geç
          if (insertError?.code === '23505') { // Unique constraint violation
            return;
          }
          throw insertError;
        }
      }
    } catch (error: any) {
      console.error("createProfileIfNotExists hatası:", error);
      // Hata durumunda toast göster
      toast({
        title: "Uyarı",
        description: error?.message || "Profil oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.",
        variant: "error",
      });
      // Hatayı yukarı fırlatma, sadece logla
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectUrl = Linking.createURL("/");
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
        toast({
          title: "Hata",
          description: "Google oturum açma başarısız. Lütfen tekrar deneyin.",
          variant: "error",
        });
        setLoading(false);
        return;
      }

      if (!data?.url) {
        toast({
          title: "Hata",
          description: "Google oturum açma başarısız. Lütfen tekrar deneyin.",
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
        
        // URL'den hash fragment'i parse et (# ile başlayan kısım)
        const urlParts = result.url.split("#");
        const hashParams = urlParts[1] || "";
        
        // Hash parametrelerini parse et
        const params = new URLSearchParams(hashParams);
        const code = params.get("code");
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        // access_token && refresh_token durumunda
        if (access_token && refresh_token) {
          const { data: sessionData, error: setSessionError } =
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

          if (setSessionError || !sessionData?.session) {
            toast({
              title: "Hata",
              description:
                "Google oturum açma başarısız. Lütfen tekrar deneyin.",
              variant: "error",
            });
            setLoading(false);
            return;
          }

          // Küçük bir bekleme ekle (Supabase state güncellemesi için)
          await new Promise((resolve) => setTimeout(resolve, 500));

          await createProfileIfNotExists();
          setLoading(false);
        }

        // code durumunda da aynı
        else if (code) {
          const {
            data: { session },
            error: exchangeError,
          } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError || !session) {
            toast({
              title: "Hata",
              description:
                "Google oturum açma başarısız. Lütfen tekrar deneyin.",
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
            title: "Hata",
            description: "Google oturum açma başarısız. Lütfen tekrar deneyin.",
            variant: "error",
          });
          setLoading(false);
        }
      }
    } catch {
      toast({
        title: "Hata",
        description: "Google oturum açma başarısız. Lütfen tekrar deneyin.",
        variant: "error",
      });
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={{
        borderRadius: radius(12),
        paddingVertical: hp(1.5),
        backgroundColor: palette.purple,
        marginVertical: hp(1),
        marginBottom: hp(2),
      }}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      <Text
        style={{
          fontSize: fontSize(20),
          fontWeight: "bold",
          color: palette.primaryForeground,
          textAlign: "center",
        }}
      >
        {loading ? "Google ile Oturum Açılıyor..." : text}
      </Text>
    </TouchableOpacity>
  );
};

export default GoogleSignIn;
