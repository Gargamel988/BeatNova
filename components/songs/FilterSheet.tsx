import React from "react";
import { TouchableOpacity } from "react-native";
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

const filterOptions: FilterOption[] = [
  {
    key: "favorites",
    label: "Favoriler",
    description: "Sık dinlediklerini öne çıkar",
    icon: Heart,
  },
  {
    key: "downloaded",
    label: "İndirilenler",
    description: "Cihazında saklanan parçaları göster",
    icon: Download,
  },
  {
    key: "recent",
    label: "Son eklenenler",
    description: "Son dinlediğin veya eklediğin şarkılar",
    icon: Clock4,
  },
  {
    key: "hasArtwork",
    label: "Albüm görseli olanlar",
    description: "Kapak görseli bulunan şarkılar",
    icon: ImageIcon,
  },
];

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
  const { wp, fontSize } = useResponsive();
  const textPrimary = useColor("text");
  const textSecondary = useColor("textSecondary");
  const cardBgActive = useColor("card");
  const cardBgInactive = useColor("background1");

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      title="Gelişmiş Filtreler"
    >
      <View style={{ gap: wp(4) }}>
        <View style={{ marginLeft: wp(2) }}>
          <Text
            style={{
              fontSize: fontSize(16),
              fontWeight: "bold",
              color: textPrimary,
            }}
          >
            Dinleme deneyimi
          </Text>
          <Text
            style={{
              fontSize: fontSize(12),
              color: textSecondary,
            }}
          >
            Tercih ettiğin şarkı türlerini seç, sana özel liste hazırlayalım.
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
                        className="mr-3 rounded-full p-2"
                        style={{
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
              Sıfırla
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-2xl items-center"
            activeOpacity={0.9}
            onPress={onApplyFilters}
            style={{ backgroundColor: "#9333ea" }}
          >
            <Text className="text-white font-semibold">Uygula</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

