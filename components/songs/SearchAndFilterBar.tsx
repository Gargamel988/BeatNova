import React from "react";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { SearchBar } from "@/components/ui/searchbar";
import { Icon } from "@/components/ui/icon";
import { useResponsive } from "@/hooks/useResponsive";
import { Filter, SortDescIcon } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";

interface SearchAndFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterPress: () => void;
  onSortPress: () => void;
}

export default function SearchAndFilterBar({
  searchQuery,
  onSearchChange,
  onFilterPress,
  onSortPress,
}: SearchAndFilterBarProps) {
  const { wp, hp, fontSize, radius } = useResponsive();

  const cardBgInactive = useColor("background1");
  const cardBorder = useColor("border");

  return (
    <>
      <View
        style={{
          paddingHorizontal: wp(4),
          paddingBottom: hp(1),
        }}
      >
        <SearchBar
          placeholder="Şarkı, sanatçı veya albüm ara..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          onSearch={onSearchChange}
          value={searchQuery}
          onChangeText={onSearchChange}
          showClearButton={false}
          containerStyle={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            marginTop: hp(1),
            borderColor: "rgba(255,255,255,0.12)",
          }}
          inputStyle={{
            color: "#ffffff",
            fontSize: fontSize(16),
          }}
          leftIcon={<Feather name="search" size={fontSize(18)} color="white" />}
        />
      </View>
      <View
        className="flex-row items-center"
        style={{
          paddingHorizontal: wp(4),
          paddingBottom: hp(2),
          borderBottomWidth: 1,
          borderBottomColor: cardBorder,
          gap: wp(2),
        }}
      >
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2  "
          activeOpacity={0.9}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            paddingVertical: hp(1.5),
            borderRadius: radius(12),
            borderColor: cardBorder,
          }}
          onPress={onFilterPress}
        >
          <Icon name={Filter} size={16} color="white" />
          <Text
            className="text-white font-medium"
            style={{ fontSize: fontSize(16) }}
          >
            Filtrele
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2  "
          activeOpacity={0.9}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            paddingVertical: hp(1.5),
            borderRadius: radius(12),
            borderColor: cardBorder,
          }}
          onPress={onSortPress}
        >
          <Icon name={SortDescIcon} size={16} color="white" />
          <Text
            className="text-white font-medium"
            style={{ fontSize: fontSize(16) }}
          >
            Sırala
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

