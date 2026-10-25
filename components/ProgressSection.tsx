import { Progress } from "./ui/progress";
import { View } from "./ui/view";
import { Text } from "./ui/text";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useResponsive } from "@/hooks/useResponsive";

type ProgressSectionProps = {
	progress: number;
	duration: number;
	position: number;
	formatTime: (seconds: number) => string;
	handleSeek: (durationSeconds: number) => (value: number) => number | void;
};

export default function ProgressSection({
	progress,
	duration,
	position,
	formatTime,
	handleSeek,
}: ProgressSectionProps) {
	const { palette: colors } = useThemeModeContext();
	const { fontSize } = useResponsive();
	return (
		<View style={{ gap: 12, direction: "ltr" }}>
			<Progress
				value={progress}
				interactive={true}
				height={fontSize(6)}
				onValueChange={handleSeek ? handleSeek(duration) : undefined}
			/>
			<View
				className="flex-row justify-between"
				style={{ direction: "ltr", flexDirection: "row" }}
			>
				<Text style={{ color: colors.player.textMuted, fontSize: fontSize(12) }}>{formatTime(position)}</Text>
				<Text style={{ color: colors.player.textMuted, fontSize: fontSize(12) }}>{formatTime(duration)}</Text>
			</View>
		</View>
	);
}
