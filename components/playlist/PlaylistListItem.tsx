import { useResponsive } from "@/hooks/useResponsive";
import { TouchableOpacity, Image } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Music2, Clock } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { formatTime } from "@/utils/format";
import { useState } from "react";
import PlayListPlayModal from "./PlayListPlayModal";

type Playlist = {
	id: number;
	name: string;
	song_count: number;
	duration: string;
	cover_url: string;
	audio_url: string;
	gradient: [string, string];
	isPinned: boolean;
	mood?: string[];
	song_cover_urls?: string[]; // İlk 4 şarkının cover_url'leri
  };
export default function PlaylistListItem({ playlist }: { playlist: Playlist }) {
	const  [isModalVisible, setIsModalVisible] = useState(false);
	const { wp, fontSize, radius } = useResponsive();
	const cardBg = useColor("card");
	const borderColor = useColor("border");
	const textPrimary = useColor("authPrimaryText");
	const textSecondary = useColor("authSecondaryText");
  const songCount = playlist?.song_count ?? 0;
  const duration = playlist?.duration ?? 0;
  const durationString = formatTime(Number(duration));
  const mood = playlist?.mood?.slice(0, 3);
	return (
	  <TouchableOpacity
		activeOpacity={0.9}
		style={{
		  flexDirection: "row",
		  alignItems: "center",
		  backgroundColor: cardBg,
		  borderRadius: radius(16),
		  padding: wp(3),
		  borderWidth: 1,
		  borderColor,
		  gap: wp(3),
		}}
		onPress={() => setIsModalVisible(true)}
	  >
		<View
		  style={{
			width: wp(18),
			height: wp(18),
			borderRadius: radius(14),
			overflow: "hidden",
			backgroundColor: cardBg,
		  }}
		>
		  {playlist?.song_cover_urls && playlist.song_cover_urls.length > 0 ? (
			<View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
			  {[0, 1, 2, 3].map((index) => {
				const coverUrl = playlist.song_cover_urls?.[index];
				const hasCover = coverUrl && coverUrl.trim() !== "";
				return (
				  <View
					key={index}
					style={{
					  width: "50%",
					  height: "50%",
					  borderWidth: 0.5,
					  borderColor: borderColor,
					}}
				  >
					{hasCover ? (
					  <Image
						source={{ uri: coverUrl }}
						style={{ width: "100%", height: "100%" }}
						resizeMode="cover"
					  />
					) : (
					  <View
						style={{
						  width: "100%",
						  height: "100%",
						  backgroundColor: cardBg,
						}}
					  />
					)}
				  </View>
				);
			  })}
			</View>
		  ) : playlist?.cover_url && playlist.cover_url.trim() !== "" ? (
			<Image
			  source={{ uri: playlist.cover_url }}
			  style={{ width: "100%", height: "100%" }}
			  resizeMode="cover"
			/>
		  ) : (
			<View
			  style={{
				width: "100%",
				height: "100%",
				backgroundColor: cardBg,
				alignItems: "center",
				justifyContent: "center",
			  }}
			>
			  <Icon name={Music2} size={wp(8)} color={textSecondary} />
			</View>
		  )}
		</View>
		<View style={{ flex: 1 }}>
		  <View
			style={{
			  flexDirection: "row",
			  alignItems: "center",
			  justifyContent: "space-between",
			}}
		  >
			<Text
			  style={{
				color: textPrimary,
				fontSize: fontSize(16),
				fontWeight: "700",
				flex: 1,
			  }}
			  numberOfLines={1}
			>
			  {playlist?.name}
			</Text>
			{mood?.map((moodItem: string, index: number) => (
			<View key={`${moodItem}-${index}`}
			  style={{
				backgroundColor: "rgba(255,255,255,0.05)",
				paddingHorizontal: wp(2),
				paddingVertical: wp(1),
				borderRadius: radius(10),
				marginLeft: wp(1),
			  }}
			>
			  <Text
				style={{
				  color: textSecondary,
				  fontSize: fontSize(11),
				  fontWeight: "600",
				}}
			  >
				{moodItem}
			  </Text>
			</View>
			))}
		  </View>
		  <View
			style={{
			  flexDirection: "row",
			  alignItems: "center",
			  gap: wp(2),
			  marginTop: wp(1),
			}}
		  >
			<View
			  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
			>
			  <Icon name={Music2} size={12} color={textSecondary} />
			  <Text
				style={{
				  color: textSecondary,
				  fontSize: fontSize(12),
				}}
			  >
				{songCount} şarkı
			  </Text>
			</View>
			<Text style={{ color: textSecondary }}>•</Text>
			<View
			  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
			>
			  <Icon name={Clock} size={12} color={textSecondary} />
			  <Text
				style={{
				  color: textSecondary,
				  fontSize: fontSize(12),
				}}
			  >
				{durationString}
			  </Text>
			</View>
		  </View>
		</View>

		<PlayListPlayModal 
			visible={isModalVisible} 
			onClose={() => setIsModalVisible(false)} 
			playlistId={playlist.id}
		/>
	  </TouchableOpacity>
	);
  }