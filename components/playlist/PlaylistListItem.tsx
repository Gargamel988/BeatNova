import React, { useState, useCallback } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { TouchableOpacity, Image, Alert } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Music2, Clock, MoreVertical, Copy, Share2, Trash2 } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { formatTime } from "@/utils/format";

import PlayListPlayModal from "./PlayListPlayModal";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlaylist, clonePlaylist, getPlaylistShareData } from "@/services/PlaylistServices";

import { useToast } from "@/components/ui/toast";
import { useThemeModeContext } from "@/providers/theme-provider";
import { Share } from "react-native";
import { PlaylistType } from "@/type/PlaylistType";

export default React.memo(function PlaylistListItem({ playlist }: { playlist: PlaylistType }) {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isMenuVisible, setIsMenuVisible] = useState(false);
	const { wp, fontSize, radius } = useResponsive();
	const cardBg = useColor("card");
	const borderColor = useColor("border");
	const textPrimary = useColor("authPrimaryText");
	const textSecondary = useColor("authSecondaryText");
	const { palette: colors } = useThemeModeContext();
	const songCount = playlist?.song_count ?? 0;
	const duration = playlist?.duration ?? 0;
	const durationString = formatTime(Number(duration));
	const mood = playlist?.mood?.slice(0, 3);
	const queryClient = useQueryClient();
	const { toast } = useToast();

	const deleteMutation = useMutation({
		mutationFn: (id: number | string) => deletePlaylist(id),
		onSuccess: () => {
			toast({
				title: "Başarılı",
				description: "Playlist başarıyla silindi",
				variant: "success",
			});
			queryClient.invalidateQueries({ queryKey: ["playlists"] });
		},
		onError: (error: any) => {
			toast({
				title: "Hata",
				description: error.message || "Playlist silinirken bir hata oluştu",
				variant: "error",
			});
		},
	});

	const cloneMutation = useMutation({
		mutationFn: (id: number | string) => clonePlaylist(id),
		onSuccess: () => {
			toast({
				title: "Başarılı",
				description: "Playlist kopyalandı",
				variant: "success",
			});
			queryClient.invalidateQueries({ queryKey: ["playlists"] });
		},
		onError: (error: any) => {
			toast({
				title: "Hata",
				description: error.message || "Kopyalama başarısız",
				variant: "error",
			});
		},
	});

	const handleDelete = useCallback(() => {
		Alert.alert(
			"Playlist'i Sil",
			"Bu playlist'i ve içindeki tüm şarkı bağlantılarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
			[
				{ text: "İptal", style: "cancel" },
				{
					text: "Sil",
					style: "destructive",
					onPress: () => deleteMutation.mutate(playlist.id as number),
				},
			]
		);
	}, [playlist.id, deleteMutation]);

	const handleClone = useCallback(() => {
		cloneMutation.mutate(playlist.id as number);
	}, [playlist.id, cloneMutation]);

	const handleShare = useCallback(async () => {
		try {
			const shareData = await getPlaylistShareData(playlist.id as number);
			await Share.share({
				message: shareData.text,
				title: shareData.title,
			});
		} catch (error: any) {
			if (error.message !== "User did not share") {
				toast({
					title: "Hata",
					description: "Paylaşma sırasında hata oluştu",
					variant: "error",
				});
			}
		}
	}, [playlist.id, toast]);

	const handleLongPress = useCallback(() => {
		Alert.alert(
			playlist.name,
			"Ne yapmak istiyorsun?",
			[
				{
					text: "📋 Kopyala (Klonla)",
					onPress: handleClone,
				},
				{
					text: "📤 Paylaş",
					onPress: handleShare,
				},
				{
					text: "🗑️ Sil",
					style: "destructive",
					onPress: handleDelete,
				},
				{
					text: "İptal",
					style: "cancel",
				},
			]
		);
	}, [playlist.name, handleClone, handleShare, handleDelete]);

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
			onLongPress={handleLongPress}
			delayLongPress={500}
		>
			{/* Playlist Kapağı */}
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

			{/* Playlist Bilgisi */}
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
						<View
							key={`${moodItem}-${index}`}
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

			{/* More butonu */}
			<TouchableOpacity
				onPress={handleLongPress}
				style={{
					padding: wp(2),
					borderRadius: radius(8),
				}}
			>
				<Icon name={MoreVertical} size={wp(5)} color={textSecondary} />
			</TouchableOpacity>

			{/* Playlist Play Modal */}
			<PlayListPlayModal
				visible={isModalVisible}
				onClose={() => setIsModalVisible(false)}
				playlistId={playlist.id as number}
				playlistData={playlist}
			/>
		</TouchableOpacity>
	);
});