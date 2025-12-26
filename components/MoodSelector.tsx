import React, { useState } from "react";
import { Moon, Sun, Zap, Focus, Cloud } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ScrollView } from "@/components/ui/scroll-view";

type Mood = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  colors: string;
};

const moods: Mood[] = [
  {
    id: "chill",
    label: "Chill",
    icon: Cloud,
    colors: "#007AFF",
  },
  {
    id: "energetic",
    label: "Enerjik",
    icon: Zap,
    colors: "#f97316",
  },
  {
    id: "focus",
    label: "Odak",
    icon: Focus,
    colors: "#34c759",
  },
  {
    id: "night",
    label: "Gece",
    icon: Moon,
    colors: "#6366f1",
  },
  {
    id: "sad",
    label: "Hüzünlü",
    icon: Sun,
    colors: "#78788033",
  },
];
export default function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  return (
    <>
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-white text-xl font-bold">Ruh halin nasıl?</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16, gap: 12 }}
        className="flex-row"
      >
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;

          return (
            <Button
              variant="outline"
              key={mood.id}
              size="sm"
              onPress={() => setSelectedMood(mood.id)}
              style={{ backgroundColor: isSelected ? mood.colors : "transparent" }}
            >
              <View className="px-6 py-3 rounded-full flex-row items-center gap-2">
                <Icon size={16} color="#d1d5db" />
                <Text className="text-white whitespace-nowrap">
                  {mood.label}
                </Text>
              </View>
            </Button>
          );
        })}
      </ScrollView>

    </>
  );
}
