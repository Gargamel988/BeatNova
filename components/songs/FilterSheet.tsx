import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useResponsive } from "@/hooks/useResponsive";
import { Heart, Download, Clock4, ImageIcon, Check } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";

type FilterKey = "favorites" | "downloaded" | "recent" | "hasArtwork";

type FilterOption = {
  key: FilterKey;
  label: string;
  description: string;
  icon: any;
};

interface FilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  filtersState: Record<FilterKey, boolean>;
  onToggleFilter: (key: FilterKey) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export default function FilterSheet({
  isVisible,
  onClose,
  filtersState,
  onToggleFilter,
  onResetFilters,
  onApplyFilters,
}: FilterSheetProps) {
  const { t } = useTranslation();
  const { wp, fontSize } = useResponsive();
  const textPrimary = useColor("text");
  const textSecondary = useColor("textSecondary");
  const cardBgActive = useColor("card");
  const cardBgInactive = useColor("background1");

  const filterOptions: FilterOption[] = useMemo(
    () => [
      {
        key: "favorites",
        label: t("songs.filterFavorites"),
        description: t("songs.filterFavoritesDesc"),
        icon: Heart,
      },
      {
        key: "downloaded",
        label: t("songs.filterDownloaded"),
        description: t("songs.filterDownloadedDesc"),
        icon: Download,
      },
      {
        key: "recent",
        label: t("songs.filterRecent"),
        description: t("songs.filterRecentDesc"),
        icon: Clock4,
      },
      {
        key: "hasArtwork",
        label: t("songs.filterHasArtwork"),
        description: t("songs.filterHasArtworkDesc"),
        icon: ImageIcon,
      },
    ],
    [t]
  );

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      title={t("songs.advancedFilters")}
    >
      <View style={{ gap: wp(4) }}>
        <View style={{ marginStart: wp(2) }}>
          <Text
            style={{
              fontSize: fontSize(16),
              fontWeight: "bold",
              color: textPrimary,
            }}
          >
            {t("songs.listeningExperience")}
          </Text>
          <Text
            style={{
              fontSize: fontSize(12),
              color: textSecondary,
            }}
          >
            {t("songs.listeningExperienceDesc")}
          </Text>
        </View>
        <View style={{ gap: wp(3) }}>
          {filterOptions.map((option) => {
            const isActive = filtersState[option.key];
            return (
              <TouchableOpacity
                key={option.key}
                className="flex-row items-start justify-between rounded-2xl border px-4 py-3"
                activeOpacity={0.9}
                onPress={() => onToggleFilter(option.key)}
                style={{
                  backgroundColor: isActive ? cardBgActive : cardBgInactive,
                  borderColor: isActive ? textSecondary : "rgba(148, 163, 184, 0.5)",
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="rounded-full p-2"
                    style={{
                      marginEnd: wp(3),
                      backgroundColor: isActive
                        ? "rgba(147, 51, 234, 0.6)"
                        : "rgba(15,23,42,0.9)",
                    }}
                  >
                    <Icon name={option.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-semibold"
                      style={{ color: textPrimary }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: textSecondary }}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
                <View
                  className="w-6 h-6 rounded-full border flex items-center justify-center"
                  style={{
                    backgroundColor: isActive ? "#9333ea" : "transparent",
                    borderColor: isActive
                      ? "#a855f7"
                      : "rgba(148, 163, 184, 0.7)",
                  }}
                >
                  {isActive && <Icon name={Check} size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 py-3 rounded-2xl items-center"
            activeOpacity={0.9}
            onPress={onResetFilters}
            style={{ backgroundColor: cardBgInactive }}
          >
            <Text
              className="font-semibold"
              style={{ color: textPrimary }}
            >
              {t("songs.reset")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-2xl items-center"
            activeOpacity={0.9}
            onPress={onApplyFilters}
            style={{ backgroundColor: "#9333ea" }}
          >
            <Text className="text-white font-semibold">{t("songs.apply")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

