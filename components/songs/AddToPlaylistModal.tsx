import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheet } from '../ui/bottom-sheet';
import { PlaylistType } from '@/type/PlaylistType';
import { useResponsive } from '@/hooks/useResponsive';
import { useColor } from '@/hooks/useColor';
import { Input } from '../ui/input';
import { Icon } from '../ui/icon';
import { Search, ListMusic, Check, Globe, Lock, Music2 } from 'lucide-react-native';
import { addSongToPlaylist } from '@/services/PlaylistServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/toast';
import { EmptyState } from '../ui/empty-state';
import { LoadingState } from '../ui/loading-state';

interface AddToPlaylistModalProps {
	isVisible: boolean;
	onClose: () => void;
	playlists: PlaylistType[];
	onSelectPlaylist?: (playlist: PlaylistType) => void;
	isLoadingData: boolean;
	selectedSongId?: string;
}

export default function AddToPlaylistModal({
	isVisible,
	onClose,
	playlists = [],
	onSelectPlaylist,
	isLoadingData,
	selectedSongId,
}: AddToPlaylistModalProps) {
	const { wp, hp, fontSize, radius } = useResponsive();
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const cardBg = useColor('card');
	const borderColor = useColor('border');
	const textPrimary = useColor('authPrimaryText');
	const textSecondary = useColor('authSecondaryText');
	const accent = useColor('accent');
	const accentForeground = useColor('accentForeground');
	const muted = useColor('muted');
	const { toast } = useToast();
	// Filtrelenmiş playlistler
	const filteredPlaylists = useMemo(() => {
		if (!Array.isArray(playlists) || playlists.length === 0) return [];
		if (!searchQuery.trim()) return playlists;
		const query = searchQuery.toLowerCase();
		return playlists.filter(
			(playlist) =>
				playlist?.name?.toLowerCase().includes(query) ||
				playlist?.description?.toLowerCase().includes(query) ||
				playlist?.tags?.some((tag) => tag?.toLowerCase().includes(query))
		);
	}, [playlists, searchQuery]);
	const {mutate: addSongToPlaylistMutation} = useMutation({
		mutationFn: async (playlistId: number) => {
			return addSongToPlaylist(selectedSongId as string, playlistId);
		},
		onSuccess: () => {
			toast({
				title: "Playliste ekleme işlemi başarılı",
				description: "Şarkı başarıyla playliste eklendi",
				variant: "success",
			});
			queryClient.invalidateQueries({ queryKey: ['playlists'] });
			onClose();
			setSearchQuery('');
			setSelectedPlaylistId(null);
		},
		onError: (error) => {
			toast({
				title: "Playliste ekleme işlemi başarısız",
				description: error.message,
				variant: "error",
			});
		},
	});

	const handleSelectPlaylist = async (playlist: PlaylistType) => {
		if (isLoading) return;
		
		setSelectedPlaylistId(playlist.id || null);
		setIsLoading(true);

		try {
			// Şarkıyı playlist'e ekleme işlemi burada yapılacak
			addSongToPlaylistMutation(playlist.id as number);
		} catch (error) {
			console.error('Playlist\'e ekleme hatası:', error);
			setIsLoading(false);
			setSelectedPlaylistId(null);
		}
	};

	if (isLoadingData) {
		return <LoadingState message="Playlistler yükleniyor..." size="large" showIcon={true} fullScreen={true} />;
	}

	const renderPlaylistItem = ({ item, index }: { item: PlaylistType; index?: number }) => {
		if (!item || !item.id) {
			return <View key={`playlist-${index}`} style={{ height: 0 }} />;
		}
		const isSelected = selectedPlaylistId === item.id;
		const isPublic = item.is_public;

		return (
			<TouchableOpacity
				key={item.id}
				activeOpacity={0.7}
				onPress={() => handleSelectPlaylist(item)}
				disabled={isLoading}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					backgroundColor: cardBg,
					borderRadius: radius(16),
					padding: wp(3.5),
					marginBottom: hp(1),
					borderWidth: 1,
					borderColor: isSelected ? accent : borderColor,
					gap: wp(3),
					opacity: isLoading && !isSelected ? 0.6 : 1,
				}}
			>
				{/* Playlist Icon/Thumbnail */}
				<View
					style={{
						width: wp(14),
						height: wp(14),
						borderRadius: radius(12),
						backgroundColor: isSelected ? accent : muted + '30',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden',
					}}
				>
					{isSelected ? (
						<Icon name={Check} size={wp(7)} color={accentForeground} />
					) : (
						<Icon name={ListMusic} size={wp(7)} color={isSelected ? accentForeground : textSecondary} />
					)}
				</View>

				{/* Playlist Info */}
				<View style={{ flex: 1, gap: hp(0.5) }}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: wp(2),
						}}
					>
						<Text
							style={{
								color: textPrimary,
								fontSize: fontSize(16),
								fontWeight: '700',
								flex: 1,
							}}
							numberOfLines={1}
						>
							{item.name}
						</Text>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: wp(1.5),
								backgroundColor: muted + '20',
								paddingHorizontal: wp(2),
								paddingVertical: wp(1),
								borderRadius: radius(8),
							}}
						>
							<Icon
								name={isPublic ? Globe : Lock}
								size={12}
								color={textSecondary}
							/>
							<Text
								style={{
									color: textSecondary,
									fontSize: fontSize(10),
									fontWeight: '600',
								}}
							>
								{isPublic ? 'Herkese Açık' : 'Özel'}
							</Text>
						</View>
					</View>

					{item.description ? (
						<Text
							style={{
								color: textSecondary,
								fontSize: fontSize(13),
							}}
							numberOfLines={1}
						>
							{item.description}
						</Text>
					) : null}

					{/* Tags */}
					{item.tags && item.tags.length > 0 ? (
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: wp(1.5),
								marginTop: hp(0.3),
							}}
						>
							{item.tags.slice(0, 3).map((tag, index) => (
								<View
									key={index}
									style={{
										backgroundColor: accent + '20',
										paddingHorizontal: wp(2),
										paddingVertical: wp(0.8),
										borderRadius: radius(6),
									}}
								>
									<Text
										style={{
											color: accent,
											fontSize: fontSize(10),
											fontWeight: '600',
										}}
									>
										{tag}
									</Text>
								</View>
							))}
							{item.tags.length > 3 && (
								<Text
									style={{
										color: textSecondary,
										fontSize: fontSize(10),
									}}
								>
									+{item.tags.length - 3}
								</Text>
							)}
						</View>
					) : null}
				</View>

				{/* Loading Indicator */}
				{isLoading && isSelected && (
					<ActivityIndicator size="small" color={accent} />
				)}
			</TouchableOpacity>
		);
	};


	return (
		<BottomSheet
			isVisible={isVisible}
			onClose={onClose}
			snapPoints={[0.5, 0.75, 0.9]}
			disablePanGesture={false}
			title="Playlist'e Ekle"
		>
			<View style={{ flex: 1, gap: hp(2) }}>
				{/* Search Input */}
				<Input
					placeholder="Playlist ara..."
					placeholderTextColor={textSecondary}
					value={searchQuery}
					onChangeText={setSearchQuery}
					icon={Search}
					containerStyle={{
						backgroundColor: cardBg,
						borderRadius: radius(99),
						borderWidth: 1,
						borderColor,
					}}
					inputStyle={{
						color: textPrimary,
						fontSize: fontSize(15),
					}}
				/>

				{/* Playlist Count */}
				{filteredPlaylists.length > 0 && (
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: wp(1.5),
							}}
						>
							<Icon name={Music2} size={14} color={textSecondary} />
							<Text
								style={{
									color: textSecondary,
									fontSize: fontSize(13),
									fontWeight: '600',
								}}
							>
								{filteredPlaylists.length} playlist
							</Text>
						</View>
					</View>
				)}

				{/* Playlist List */}
				{filteredPlaylists.length > 0 ? (
					<View style={{ flex: 1 }}>
						{filteredPlaylists.map((playlist, index) => 
							renderPlaylistItem({ item: playlist, index })
						)}
					</View>
				) : (
					<EmptyState 
						title={searchQuery ? 'Playlist Bulunamadı' : 'Henüz Playlist Yok'}
						message={searchQuery
							? `"${searchQuery}" için sonuç bulunamadı`
							: 'Şarkılarınızı organize etmek için yeni bir playlist oluşturun'}
						icon="playlist"
					/>
				)}
			</View>
		</BottomSheet>
	);
}