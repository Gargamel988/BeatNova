import { z } from "zod";

export const LoginScheme = z.object({
  email: z
    .string({required_error: "E-posta adresi boş bırakılamaz"})
    .email({ message: "Geçerli bir e-posta adresi giriniz" })
  ,
  password: z
    .string({required_error: "Şifre boş bırakılamaz"})
    .max(100, { message: "Şifre en fazla 100 karakter olabilir" })
    .min(8, { message: "Şifre en az 8 karakter olabilir" })
});

export type LoginSchemeType = z.infer<typeof LoginScheme>;
