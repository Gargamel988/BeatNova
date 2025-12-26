import { Button, ButtonSize, ButtonVariant } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useModeToggle } from "@/hooks/useModeToggle";
import { ThemeMode } from "@/theme/colors";
import { Palette, Sunrise, Sunset } from "lucide-react-native";
import { ComponentProps, useEffect, useState } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type IconName = ComponentProps<typeof Icon>["name"];

const MODE_ICONS: Record<ThemeMode, IconName> = {
  system: Palette,
  aurora: Sunrise,
  sunset: Sunset,
};

export const ModeToggle = ({ variant = "outline", size = "icon" }: Props) => {
  const { toggleMode, mode } = useModeToggle();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const [visibleMode, setVisibleMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    scale.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setVisibleMode)(mode);
      scale.value = withTiming(1, { duration: 150 });
    });
    rotation.value = withTiming(rotation.value + 120, { duration: 300 });
  }, [mode]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const IconComponent = MODE_ICONS[visibleMode];

  return (
    <Button variant={variant} size={size} onPress={toggleMode}>
      <Animated.View style={animatedStyle}>
        <Icon name={IconComponent} size={24} />
      </Animated.View>
    </Button>
  );
};
