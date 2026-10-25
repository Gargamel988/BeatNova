import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { ArrowDownAZ, Clock3, Timer, Check } from "lucide-react-native";

type SortOptionKey = "alphabetical" | "recent" | "duration";

type SortOption = {
  key: SortOptionKey;
  label: string;
  description: string;
  icon: any;
};

interface SortSheetProps {
  isVisible: boolean;
  onClose: () => void;
  currentSortOption: SortOptionKey;
  onSelectSort: (key: SortOptionKey) => void;
}

export default function SortSheet({
  isVisible,
  onClose,
  currentSortOption,
  onSelectSort,
}: SortSheetProps) {
  const { t } = useTranslation();
  const { wp, fontSize } = useResponsive();
  const textPrimary = useColor("text");
  const textSecondary = useColor("textSecondary");
  const cardBgActive = useColor("card");
  const cardBgInactive = useColor("background1");

  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        key: "alphabetical",
        label: t("songs.sortAlphabetical"),
        description: t("songs.sortAlphabeticalDesc"),
        icon: ArrowDownAZ,
      },
      {
        key: "recent",
        label: t("songs.sortRecent"),
        description: t("songs.sortRecentDesc"),
        icon: Clock3,
      },
      {
        key: "duration",
        label: t("songs.sortDuration"),
        description: t("songs.sortDurationDesc"),
        icon: Timer,
      },
    ],
    [t]
  );

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} title={t("songs.sorting")}>
      <View className="gap-4">
        <View>
          <Text
            className="font-semibold mb-1"
            style={{ fontSize: fontSize(16), color: textPrimary }}
          >
            {t("songs.sort")}
          </Text>
          <Text
            className="text-sm"
            style={{ color: textSecondary }}
          >
            {t("songs.sortingDesc")}
          </Text>
        </View>
        <View className="gap-3">
          {sortOptions.map((option) => {
            const isSelected = currentSortOption === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                className="flex-row items-center justify-between rounded-2xl border px-4 py-3"
                activeOpacity={0.9}
                onPress={() => onSelectSort(option.key)}
                style={{
                  backgroundColor: isSelected ? cardBgActive : cardBgInactive,
                  borderColor: isSelected
                    ? textSecondary
                    : "rgba(148, 163, 184, 0.5)",
                  borderWidth: 1,
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="rounded-full p-2"
                    style={{
                      marginEnd: wp(3),
                      backgroundColor: isSelected
                        ? "rgba(147, 51, 234, 0.6)"
                        : "rgba(15,23,42,0.9)",
                    }}
                  >
                    <Icon
                      name={option.icon}
                      size={fontSize(18)}
                      color="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-semibold"
                      style={{ fontSize: fontSize(16), color: textPrimary }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ fontSize: fontSize(12), color: textSecondary }}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
                <View
                  className="w-6 h-6 rounded-full border flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? "#9333ea" : "transparent",
                    borderColor: isSelected
                      ? "#a855f7"
                      : "rgba(148, 163, 184, 0.7)",
                  }}
                >
                  {isSelected && (
                    <Icon name={Check} size={fontSize(14)} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
}

