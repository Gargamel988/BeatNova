import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import MusicInfo from 'expo-music-info-2';

export default function Method3_WithMetadata() {
  const [songsWithMetadata, setSongsWithMetadata] = useState<any[]>([]);

  useEffect(() => {
    loadSongsWithMetadata();
    
  }, []);

  const loadSongsWithMetadata = async () => {
    try {
      // İzin al
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Müzikleri al
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 20, 
      });

      // Her şarkı için metadata al
      const songsWithInfo = await Promise.all(
        assets.assets.map(async (asset) => {
          try {
            const metadata = await MusicInfo.MusicInfo.getMusicInfoAsync(asset.uri, {
              title: true,
              artist: true,
              album: true,
              genre: true,
              picture: true, 
            });

            return {
              ...asset,
              metadata,
            };
          } catch (error ) {
            console.warn('Metadata alınamadı:', asset.filename);
            console.error('Hata:', error);
            return asset;
          }
        })
      );

      setSongsWithMetadata(songsWithInfo);
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const renderSong = ({ item }: { item: any }) => (
    <View style={styles.item}>
      <Text style={styles.title}>
        {item.metadata?.title || item.filename}
      </Text>
      <Text style={styles.subtitle}>
        {item.metadata?.artist || 'Bilinmeyen Sanatçı'}
      </Text>
      {item.metadata?.picture && (
        <Image
          source={{ uri: item.metadata.picture }}
          style={styles.artwork}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Yöntem 3: MediaLibrary + MusicInfo</Text>
      <Text style={styles.note}>✅ Detaylı metadata ile</Text>
      <FlatList
        data={songsWithMetadata}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  artwork: {
    width: 100,
    height: 100,
    marginTop: 8,
    borderRadius: 8,
  },
});
