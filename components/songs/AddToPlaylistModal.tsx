import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
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

	const { mutate: addSongToPlaylistMutation, isPending } = useMutation({
		mutationFn: async (playlistId: number) => {
			return addSongToPlaylist(selectedSongId as string, playlistId);
		},
		onMutate: async (playlistId: number) => {
			// 1. Devam eden sorguları iptal et
			await queryClient.cancelQueries({ queryKey: ['playlistSongs', playlistId] });
			
			// 2. Önceki durumu kaydet
			const previousSongs = queryClient.getQueryData(['playlistSongs', playlistId]);
			
			// 3. İyimser güncellemeyi yap
			// Tam şarkı objesi elimizde olmadığı için sadece placeholder koyuyoruz.
			// Gerçek veri onSettled içindeki invalidateQueries ile gelecek.
			queryClient.setQueryData(['playlistSongs', playlistId], (old: any[] = []) => [
				...old, 
				{ id: selectedSongId, title: 'Ekleniyor...', isOptimistic: true }
			]);
			
			// 4. Modal'ı anında kapat, kullanıcıya hızlı hissettir
			toast({
				title: "Playliste ekleniyor",
				description: "Şarkı playliste ekleniyor...",
				variant: "success",
			});
			onClose();
			setSearchQuery('');
			
			return { previousSongs, playlistId };
		},
		onSuccess: () => {
			// Başarılı olursa sadece toast göster, invalidate zaten onSettled'da yapılıyor
			setSelectedPlaylistId(null);
		},
		onError: (error, playlistId, context) => {
			// Hata durumunda eski veriye dön
			if (context?.previousSongs) {
				queryClient.setQueryData(['playlistSongs', context.playlistId], context.previousSongs);
			}
			toast({
				title: "Playliste ekleme işlemi başarısız",
				description: error.message,
				variant: "error",
			});
			setSelectedPlaylistId(null);
		},
		onSettled: (data, error, playlistId) => {
			// İşlem bitince playlist şarkılarını ve genel playlistleri yenile
			queryClient.invalidateQueries({ queryKey: ['playlistSongs', playlistId] });
			queryClient.invalidateQueries({ queryKey: ['playlists'] });
		}
	});

	const handleSelectPlaylist = useCallback((playlist: PlaylistType) => {
		if (isPending) return;
		setSelectedPlaylistId(playlist.id || null);
		addSongToPlaylistMutation(playlist.id as number);
	}, [isPending, addSongToPlaylistMutation]);

	// Modal görünür değilse hiç render etme
	if (!isVisible) {
		return null;
	}

	// Loading durumunu BottomSheet içinde göster
	if (isLoadingData) {
		return (
			<BottomSheet
				isVisible={isVisible}
				onClose={onClose}
				snapPoints={[0.5, 0.75, 0.9]}
				disablePanGesture={false}
				title="Playlist'e Ekle"
			>
				<LoadingState message="Playlistler yükleniyor..." size="large" showIcon={true} fullScreen={false} />
			</BottomSheet>
		);
	}

	const renderPlaylistItem = ({ item, index }: { item: PlaylistType; index: number }) => {
		if (!item || !item.id) {
			return <View key={`playlist-${index}`} style={{ height: 0 }} />;
		}
		const isSelected = selectedPlaylistId === item.id;

		return (
			<TouchableOpacity
				key={item.id}
				activeOpacity={0.7}
				onPress={() => handleSelectPlaylist(item)}
				disabled={isPending}
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
					opacity: isPending && !isSelected ? 0.6 : 1,
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
						<Icon name={ListMusic} size={wp(7)} color={textSecondary} />
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

					{/* Song count */}
					<Text
						style={{
							color: textSecondary,
							fontSize: fontSize(11),
						}}
					>
						{item.song_count ?? item.songCount ?? 0} şarkı
					</Text>

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
							{item.tags.slice(0, 3).map((tag, tagIndex) => (
								<View
									key={tagIndex}
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
				{isPending && isSelected && (
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
			isScrollable={false}
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

				{/* Playlist List - FlatList ile performanslı render */}
				{filteredPlaylists.length > 0 ? (
					<FlatList
						data={filteredPlaylists}
						renderItem={renderPlaylistItem}
						keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
						showsVerticalScrollIndicator={false}
						initialNumToRender={8}
						maxToRenderPerBatch={8}
						windowSize={5}
						contentContainerStyle={{ paddingBottom: hp(4) }}
					/>
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