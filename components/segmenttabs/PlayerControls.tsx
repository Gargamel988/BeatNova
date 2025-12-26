import { ThemePalette } from "@/theme/colors";
import { View } from "@/components/ui/view";
import { TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { SkipBack, SkipForward, Pause, Play, Repeat, Repeat1, Shuffle } from "lucide-react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useResponsive } from "@/hooks/useResponsive";

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
	const { wp, fontSize, hp, radius } = useResponsive();
	const sideButtonSize = wp(12);
	const playButtonSize = wp(20);
	const horizontalPadding = wp(4);
	const topMargin = hp(4);
	return (
	  <View
		className="flex-row justify-between items-center"
		style={{
		  paddingHorizontal: horizontalPadding,
		  marginTop: topMargin,
		}}
	  >
		<TouchableOpacity
		  onPress={onShuffleToggle}
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
  