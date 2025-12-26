import { useResponsive } from "@/hooks/useResponsive";
import { TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { MoreVertical, Play } from "lucide-react-native";
import { formatTime } from "@/utils/format";

type Playlist = {
	id: number;
	name: string;
	songCount?: number;
	song_count?: number;
	duration?: string | number;
	cover?: string;
	cover_url?: string;
	gradient?: [string, string];
	isPinned?: boolean;
	is_pinned?: boolean;
	mood?: string;
  };

export default function PinnedPlaylistCard({
	playlist,
	onPressMore,
  }: {
	playlist: Playlist;
	onPressMore?: () => void;
  }) {
	const { wp, hp, fontSize, radius } = useResponsive();
  
	// Fallback değerler
	const songCount = playlist.songCount ?? playlist.song_count ?? 0;
	const duration = typeof playlist.duration === 'number' 
		? formatTime(playlist.duration) 
		: (playlist.duration || "0:00");
	const cover = playlist.cover || playlist.cover_url || "";
	const gradient = playlist.gradient || ["#a855f7", "#ec4899"] as [string, string];
  
	return (
	  <TouchableOpacity
		activeOpacity={0.9}
		style={{
		  width: wp(70),
		  height: hp(18),
		  borderRadius: radius(18),
		  overflow: "hidden",
		}}
	  >
		<LinearGradient
		  colors={gradient}
		  style={{
			flex: 1,
			padding: wp(4),
			justifyContent: "space-between",
		  }}
		>
		  <View
			style={{
			  flexDirection: "row",
			  justifyContent: "space-between",
			  alignItems: "flex-start",
			}}
		  >
			<View style={{ flex: 1, paddingRight: wp(2) }}>
			  <Text
				style={{
				  color: "#fff",
				  fontSize: fontSize(20),
				  fontWeight: "800",
				  marginBottom: 6,
				}}
				numberOfLines={2}
			  >
				{playlist.name}
			  </Text>
			  <Text
				style={{
				  color: "rgba(255, 255, 255, 0.85)",
				  fontSize: fontSize(13),
				}}
			  >
				{`${songCount} şarkı • ${duration}`}
			  </Text>
			</View>
			<TouchableOpacity
			  onPress={onPressMore}
			  style={{
				backgroundColor: "rgba(255,255,255,0.3)",
				borderRadius: radius(10),
				padding: wp(2),
			  }}
			>
			  <Icon name={MoreVertical} size={18} color="#fff" />
			</TouchableOpacity>
		  </View>
  
		  <View
			style={{
			  flexDirection: "row",
			  alignItems: "center",
			  justifyContent: "space-between",
			}}
		  >
			<View
			  style={{
				flexDirection: "row",
				alignItems: "center",
				gap: wp(2),
			  }}
			>
			  <View
				style={{
				  width: wp(16),
				  height: wp(16),
				  borderRadius: radius(12),
				  overflow: "hidden",
				  borderWidth: 1,
				  borderColor: "rgba(255,255,255,0.35)",
				}}
			  >
				{cover ? (
				  <Image
					source={{ uri: cover }}
					style={{ width: "100%", height: "100%" }}
				  />
				) : (
				  <View style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
				)}
			  </View>
			  <View>
				<Text
				  style={{
					color: "rgba(255,255,255,0.9)",
					fontSize: fontSize(12),
					fontWeight: "600",
				  }}
				>
				  Son dinlenen
				</Text>
				<Text
				  style={{
					color: "rgba(255,255,255,0.7)",
					fontSize: fontSize(11),
				  }}
				>
				  12 saat önce
				</Text>
			  </View>
			</View>
			<TouchableOpacity
			  style={{
				backgroundColor: "#fff",
				borderRadius: radius(12),
				width: wp(12),
				height: wp(12),
				alignItems: "center",
				justifyContent: "center",
			  }}
			>
			  <Icon name={Play} size={22} color="#000" style={{ marginLeft: 2 }} />
			</TouchableOpacity>
		  </View>
		</LinearGradient>
	  </TouchableOpacity>
	);
  }