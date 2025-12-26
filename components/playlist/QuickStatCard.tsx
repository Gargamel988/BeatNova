import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";

export default function QuickStatCard({
	label,
	value,
  }: {
	label: string;
	value: string;
  }) {
	const { wp, fontSize, radius } = useResponsive();
	const cardBg = useColor("card");
	const borderColor = useColor("border");
	const textPrimary = useColor("authPrimaryText");
	const textSecondary = useColor("authSecondaryText");
  
	return (
	  <View
		style={{
		  flex: 1,
		  backgroundColor: cardBg,
		  borderRadius: radius(14),
		  padding: wp(3.5),
		  borderWidth: 1,
		  borderColor,
		}}
	  >
		<View
		  style={{
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			marginBottom: wp(2),
		  }}
		>
		  <Text
			style={{
			  color: textSecondary,
			  fontSize: fontSize(12),
			  fontWeight: "600",
			}}
		  >
			{label}
		  </Text>
		
		</View>
		<Text
		  style={{
			color: textPrimary,
			fontSize: fontSize(22),
			fontWeight: "800",
		  }}
		>
		  {value}
		</Text>
	  </View>
	);
  }