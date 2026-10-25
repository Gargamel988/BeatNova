import { z } from "zod";

export const getRegisterScheme = (t?: (key: string, fallback: string) => string) =>
  z
    .object({
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
            ? t("validation.passwordRequired", "Şifre alanı boş bırakılamaz")
            : "Şifre alanı boş bırakılamaz",
        })
        .min(8, {
          message: t
            ? t("validation.passwordMin", "Şifre en az 8 karakter olmalıdır")
            : "Şifre en az 8 karakter olmalıdır",
        })
        .max(32, {
          message: t
            ? t("validation.passwordMax", "Şifre en fazla 32 karakter olmalıdır")
            : "Şifre en fazla 32 karakter olmalıdır",
        }),
      confirmPassword: z.string({
        required_error: t
          ? t("validation.confirmPasswordRequired", "Şifre tekrarı boş bırakılamaz")
          : "Şifre tekrarı boş bırakılamaz",
      }),
      username: z
        .string({
          required_error: t
            ? t("validation.usernameRequired", "Kullanıcı adı boş bırakılamaz")
            : "Kullanıcı adı boş bırakılamaz",
        })
        .min(3, {
          message: t
            ? t("validation.usernameMin", "Kullanıcı adı en az 3 karakter olmalıdır")
            : "Kullanıcı adı en az 3 karakter olmalıdır",
        })
        .max(32, {
          message: t
            ? t("validation.usernameMax", "Kullanıcı adı en fazla 32 karakter olmalıdır")
            : "Kullanıcı adı en fazla 32 karakter olmalıdır",
        })
        .regex(/^[a-zA-Z0-9_-]+$/, {
          message: t
            ? t("validation.usernameRegex", "Kullanıcı adı sadece harfler ve sayılar içerebilir")
            : "Kullanıcı adı sadece harfler ve sayılar içerebilir",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t
        ? t("validation.passwordMismatch", "Şifreler birbiriyle eşleşmiyor")
        : "Şifreler birbiriyle eşleşmiyor",
      path: ["confirmPassword"],
    });

export const RegisterScheme = getRegisterScheme();
export type RegisterSchemeType = z.infer<typeof RegisterScheme>;
