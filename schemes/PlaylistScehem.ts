import { z } from "zod";

export const PlaylistScheme = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Playlist adı en az 2 karakter olmalı" })
    .max(60, { message: "Playlist adı en fazla 60 karakter olabilir" }),
  description: z
    .string()
    .trim()
    .max(180, { message: "Açıklama 180 karakteri aşamaz" })
    .optional()
    .or(z.literal("")),

  is_public: z.boolean().default(false),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(2, { message: "Etiket en az 2 karakter olmalı" })
        .max(20, { message: "Etiket 20 karakteri aşamaz" })
    )
    .optional()
});

export type PlaylistSchemeType = z.infer<typeof PlaylistScheme>;
