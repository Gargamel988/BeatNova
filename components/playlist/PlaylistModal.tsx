import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useResponsive } from "@/hooks/useResponsive";
import {
  X,
  Tag,
  Music,
  Sparkles,
  Plus,
  Save,
  Edit3,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlaylist, updatePlaylist } from "@/services/PlaylistServices";
import { useToast } from "@/components/ui/toast";
import { PlaylistCreatePayload, PlaylistType } from "@/type/PlaylistType";
import { PlaylistScheme, PlaylistSchemeType } from "@/schemes/PlaylistScehem";

type PlaylistModalProps = {
  visible: boolean;
  onClose: () => void;
  editPlaylist?: PlaylistType | null;
};

const QUICK_TAGS = [
  "Enerjik",
  "Sakin",
  "Odak",
  "Sabah",
  "Gece",
  "Spor",
  "Yolculuk",
  "Çalışma",
];

export default function PlaylistModal({
  visible,
  onClose,
  editPlaylist,
}: PlaylistModalProps) {
  const { toast } = useToast();
  const { palette: colors } = useThemeModeContext();
  const { wp, hp, fontSize, radius } = useResponsive();

  const isEditMode = !!editPlaylist?.id;

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
    watch,
  } = useForm<PlaylistSchemeType>({
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
      tags: [],
    },
    resolver: zodResolver(PlaylistScheme as any),
  });

  // Edit modunda formu doldur
  useEffect(() => {
    if (editPlaylist && visible) {
      reset({
        name: editPlaylist.name || "",
        description: editPlaylist.description || "",
        is_public: editPlaylist.is_public || false,
        tags: editPlaylist.tags || [],
      });
    }
  }, [editPlaylist, visible, reset]);

  const queryClient = useQueryClient();

  const { mutate: createPlaylistMutation, isPending: isCreatePending } = useMutation({
    mutationFn: async (data: PlaylistCreatePayload) => {
      return createPlaylist(data);
    },
    onSuccess: () => {
      toast({
        title: "Playlist oluşturuldu",
        description: "Playlist başarıyla oluşturuldu",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });

  const { mutate: updatePlaylistMutation, isPending: isUpdatePending } = useMutation({
    mutationFn: async (data: PlaylistType) => {
      return updatePlaylist(data);
    },
    onSuccess: () => {
      toast({
        title: "Playlist güncellendi",
        description: "Playlist başarıyla güncellendi",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });

  const isPending = isCreatePending || isUpdatePending;

  const gradientColors = colors.gradient?.purplePink;
  const subtleTextColor = colors.textSecondary;
  const borderColorMuted = colors.border;

  const resetAndClose = () => {
    reset({
      name: "",
      description: "",
      is_public: false,
      tags: [],
    });
    onClose();
  };

  const handleQuickTagToggle = (label: string) => {
    const normalizedTag = label.toLowerCase();
    const tags = watch("tags");
    const next = tags?.includes(normalizedTag)
      ? tags?.filter((tag: string) => tag !== normalizedTag)
      : [...(tags ?? []), normalizedTag];
    setValue("tags", next as unknown as string[]);
  };

  const onSubmitForm = (formValues: PlaylistSchemeType) => {
    const payload: PlaylistCreatePayload = {
      name: formValues.name.trim(),
      description: formValues.description?.trim() ?? "",
      is_public: formValues.is_public,
      tags: formValues.tags ?? [],
    };

    if (isEditMode && editPlaylist?.id) {
      updatePlaylistMutation(
        { ...payload, id: editPlaylist.id } as PlaylistType,
        {
          onSuccess: () => {
            resetAndClose();
          },
        }
      );
    } else {
      createPlaylistMutation(payload, {
        onSuccess: () => {
          resetAndClose();
        },
      });
    }
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={resetAndClose}
      snapPoints={[0.85, 0.95]}
      disablePanGesture={false}
    >
      <View style={{ gap: hp(2.5) }}>
        <LinearGradient
          colors={gradientColors as [string, string]}
          style={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2.5),
            paddingBottom: hp(2),
            borderRadius: radius(24),
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}
            >
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(12),
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={isEditMode ? Edit3 : Music} size={20} color="#fff" />
              </View>
              <Text
                style={{
                  color: "#fff",
                  fontSize: fontSize(24),
                  fontWeight: "800",
                }}
              >
                {isEditMode ? "Playlist Düzenle" : "Yeni Playlist"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={resetAndClose}
              style={{
                width: wp(10),
                height: wp(10),
                borderRadius: radius(10),
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={X} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: fontSize(13),
            }}
          >
            {isEditMode
              ? "Playlist bilgilerini güncelle"
              : "Sevdiğin şarkıları bir araya getir ve paylaş"}
          </Text>
        </LinearGradient>

        <View
          style={{
            gap: hp(2.5),
            paddingHorizontal: wp(5),
          }}
        >
          {/* Cover Preview + Name */}
          <View style={{ gap: hp(1.5) }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: wp(4),
              }}
            >
              {/* Name Input */}
              <View style={{ flex: 1, gap: hp(0.5) }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSize(13),
                    fontWeight: "600",
                  }}
                >
                  Playlist Adı
                </Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Örn. Sabah Motivasyonu"
                      containerStyle={{
                        borderRadius: radius(12),
                      }}
                      inputStyle={{
                        fontSize: fontSize(16),
                      }}
                      error={errors.name?.message}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={{ gap: hp(0.8) }}>
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(13),
                fontWeight: "600",
              }}
            >
              Açıklama{" "}
              <Text style={{ color: subtleTextColor, fontSize: fontSize(11) }}>
                (isteğe bağlı)
              </Text>
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Bu playlist hangi anlar için?"
                  multiline
                  rows={3}
                  type="textarea"
                  containerStyle={{
                    borderRadius: radius(14),
                  }}
                  inputStyle={{
                    fontSize: fontSize(16),
                  }}
                  error={errors.description?.message}
                />
              )}
            />
          </View>

          {/* Quick Tags */}
          <View style={{ gap: hp(1) }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon name={Tag} size={16} color={colors.text} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(13),
                  fontWeight: "600",
                }}
              >
                Hızlı Etiketler
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: wp(2),
              }}
            >
              {QUICK_TAGS.map((tag) => {
                const normalized = tag.toLowerCase();
                const isSelected = watch("tags")?.includes(normalized);
                return (
                  <TouchableOpacity
                    key={tag}
                    activeOpacity={0.8}
                    onPress={() => handleQuickTagToggle(tag)}
                    style={{
                      paddingHorizontal: wp(3.5),
                      paddingVertical: hp(1),
                      borderRadius: radius(10),
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.card,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? colors.primary
                        : borderColorMuted,
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#fff" : colors.text,
                        fontSize: fontSize(12),
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Tags Input */}
          <View style={{ gap: hp(0.8) }}>
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(13),
                fontWeight: "600",
              }}
            >
              Özel Etiketler
              <Text
                style={{
                  color: subtleTextColor,
                  fontWeight: "400",
                  fontSize: fontSize(11),
                }}
              >
                {" "}
                (virgülle ayır)
              </Text>
            </Text>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Input
                  value={field.value?.join(",") ?? ""}
                  onChangeText={(text) => field.onChange(text.split(","))}
                  placeholder="rock, klasik, 90'lar"
                  containerStyle={{
                    borderRadius: radius(12),
                  }}
                  error={errors.tags?.message}
                  onBlur={field.onBlur}
                />
              )}
            />
          </View>

          {/* Selected Tags Display */}
          {watch("tags") && watch("tags")!.length > 0 && (
            <View
              style={{
                padding: hp(1.5),
                borderRadius: radius(14),
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: borderColorMuted,
                gap: hp(0.8),
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Icon name={Sparkles} size={14} color={colors.primary} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSize(12),
                    fontWeight: "600",
                  }}
                >
                  Seçili Etiketler ({watch("tags")?.length})
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {watch("tags")?.map((tag: string, index: number) => (
                  <View
                    key={`${tag}-${index}`}
                    style={{
                      paddingHorizontal: wp(3),
                      paddingVertical: hp(0.6),
                      borderRadius: radius(10),
                      backgroundColor: colors.primary + "22",
                      borderWidth: 1,
                      borderColor: colors.primary + "44",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: fontSize(11),
                        fontWeight: "600",
                      }}
                    >
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View
          style={{
            paddingHorizontal: wp(5),
            paddingTop: hp(1.5),
            paddingBottom: hp(2.5),
            borderTopWidth: 1,
            borderTopColor: borderColorMuted,
            flexDirection: "row",
            gap: wp(3),
          }}
        >
          <Button
            onPress={resetAndClose}
            variant="outline"
            style={{ flex: 1 }}
            textStyle={{ fontSize: fontSize(16), color: colors.text }}
          >
            <Text style={{ fontSize: fontSize(16), color: colors.text }}>
              İptal
            </Text>
          </Button>
          <Button
            icon={isEditMode ? Save : Plus}
            onPress={handleSubmit(onSubmitForm)}
            style={{ flex: 1 }}
            disabled={isSubmitting || isPending}
          >
            <Text style={{ fontSize: fontSize(16), color: colors.text }}>
              {isEditMode ? "Kaydet" : "Oluştur"}
            </Text>
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
