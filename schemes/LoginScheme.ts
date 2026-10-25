import { z } from "zod";

export const getLoginScheme = (t?: (key: string, fallback: string) => string) =>
  z.object({
    email: z
      .string({
        required_error: t
          ? t("validation.emailRequired", "E-posta adresi boş bırakılamaz")
          : "E-posta adresi boş bırakılamaz",
      })
      .email({
        message: t
          ? t("validation.emailInvalid", "Geçerli bir e-posta adresi giriniz")
          : "Geçerli bir e-posta adresi giriniz",
      }),
    password: z
      .string({
        required_error: t
          ? t("validation.passwordRequired", "Şifre boş bırakılamaz")
          : "Şifre boş bırakılamaz",
      })
      .min(8, {
        message: t
          ? t("validation.passwordMin", "Şifre en az 8 karakter olmalıdır")
          : "Şifre en az 8 karakter olmalıdır",
      })
      .max(100, {
        message: t
          ? t("validation.passwordMax", "Şifre en fazla 100 karakter olabilir")
          : "Şifre en fazla 100 karakter olabilir",
      }),
  });

export const LoginScheme = getLoginScheme();
export type LoginSchemeType = z.infer<typeof LoginScheme>;
