import { z } from "zod";

export const RegisterScheme = z.object({
  email: z
    .string({ required_error: "Email alanı boş bırakılamaz" })
    .email({ message: "Geçersiz email adresi" }),
  password: z
    .string({ required_error: "Şifre alanı boş bırakılamaz" })
    .min(8, { message: "Şifre en az 8 karakter olmalıdır" })
    .max(32, { message: "Şifre en fazla 32 karakter olmalıdır" }),

  username: z
    .string({ required_error: "Kullanıcı adı boş bırakılamaz" })
    .min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır" })
    .max(32, { message: "Kullanıcı adı en fazla 32 karakter olmalıdır" })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Kullanıcı adı sadece harfler, sayılar içerebilir",
    }),
});

export type RegisterSchemeType = z.infer<typeof RegisterScheme>;
