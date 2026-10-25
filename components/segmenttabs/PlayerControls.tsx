import { ThemePalette } from "@/theme/colors";
import { View } from "@/components/ui/view";
import { TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { SkipBack, SkipForward, Pause, Play, Repeat, Repeat1, Shuffle } from "lucide-react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";

type PlayerControlsProps = {
	shuffleActive: boolean;
	onShuffleToggle: () => void;
	onPrevious: () => void;
	onPlayToggle: () => void;
	isPlaying: boolean;
	onNext: () => void;
	loopMode: "all" | "one" | "none";
	onLoopToggle: () => void;
	colors: ThemePalette;
  };
  
  export default function PlayerControls({
	shuffleActive,
	onShuffleToggle,
	onPrevious,
	onPlayToggle,
	isPlaying,
	onNext,
	loopMode,
	onLoopToggle,
	colors,
  }: PlayerControlsProps) {
	const { t } = useTranslation();
	const { wp, fontSize, hp, radius } = useResponsive();
	const sideButtonSize = wp(12);
	const playButtonSize = wp(20);
	const horizontalPadding = wp(4);
	const topMargin = hp(4);
	return (
	  <View
		className="flex-row justify-between items-center"
		style={{
		  direction: "ltr",
		  flexDirection: "row",
		  paddingHorizontal: horizontalPadding,
		  marginTop: topMargin,
		}}
	  >
		<TouchableOpacity
		  onPress={onShuffleToggle}
		  activeOpacity={0.7}
		  accessibilityRole="button"
		  accessibilityLabel={t("player.shuffle", "Karışık Çal")}
		  accessibilityState={{ selected: shuffleActive }}
		  className=" items-center justify-center"
		  style={{
			width: sideButtonSize,
			height: sideButtonSize,
			backgroundColor: colors.overlay.white10,
			borderRadius: radius(99),
		  }}
		>
			{shuffleActive ? (
				<Icon
					name={Shuffle}
					color={colors.player.iconWhite}
					size={fontSize(24)}
				/>
			) : (
				<MaterialCommunityIcons
					name="shuffle-disabled"
					color={colors.player.iconInactive}
					size={fontSize(24)}
				/>
			)}
		</TouchableOpacity>
		<TouchableOpacity
		  onPress={onPrevious}
		  activeOpacity={0.7}
		  accessibilityRole="button"
		  accessibilityLabel={t("player.previous", "Önceki Şarkı")}
		  className=" items-center justify-center"
		  style={{
			width: sideButtonSize,
			height: sideButtonSize,
			backgroundColor: colors.overlay.white10,
			borderRadius: radius(99),
		  }}
		>
		  <SkipBack color={colors.player.iconWhite} size={fontSize(24)} />
		</TouchableOpacity>
		<TouchableOpacity
		  onPress={onPlayToggle}
		  activeOpacity={0.7}
		  accessibilityRole="button"
		  accessibilityLabel={isPlaying ? t("player.pause", "Duraklat") : t("player.play", "Oynat")}
		  className=" items-center justify-center"
		  style={{
			width: playButtonSize,
			height: playButtonSize,
			backgroundColor: colors.player.iconWhite,
			borderRadius: radius(99),
		  }}
		>
		  {isPlaying ? (
			<Pause color={colors.player.iconDark} size={fontSize(36)} />
		  ) : (
			<Play color={colors.player.iconDark} size={fontSize(36)} />
		  )}
		</TouchableOpacity>
		<TouchableOpacity
		  onPress={onNext}
		  activeOpacity={0.7}
		  accessibilityRole="button"
		  accessibilityLabel={t("player.next", "Sonraki Şarkı")}
		  className=" items-center justify-center"
		  style={{
			width: sideButtonSize,
			height: sideButtonSize,
			backgroundColor: colors.overlay.white10,
			borderRadius: radius(99),
		  }}
		>
		  <SkipForward color={colors.player.iconWhite} size={fontSize(24)} />
		</TouchableOpacity>
		<TouchableOpacity
		  onPress={onLoopToggle}
		  activeOpacity={0.7}
		  accessibilityRole="button"
		  accessibilityLabel={
			loopMode === "all"
			  ? t("player.repeatAll", "Tümünü Tekrarla")
			  : loopMode === "one"
			  ? t("player.repeatOne", "Bir Şarkıyı Tekrarla")
			  : t("player.repeatOff", "Tekrar Kapalı")
		  }
		  className=" items-center justify-center"
		  style={{
			width: sideButtonSize,
			height: sideButtonSize,
			backgroundColor: colors.overlay.white10,
			borderRadius: radius(99),
		  }}
		>
		  {loopMode === "all" ? (
			<Icon
			  name={Repeat}
			  color={colors.player.iconInactive}
			  size={fontSize(22)}
			/>
		  ) : loopMode === "one" ? (
			<Icon
			  name={Repeat1}
			  color={colors.player.iconInactive}
			  size={fontSize(22)}
			/>
		  ) : (
			<MaterialCommunityIcons
			  name="repeat-off"
			  color={colors.player.iconInactive}
			  size={fontSize(22)}
			/>
		  )}
		</TouchableOpacity>
	  </View>
	);
  }
  