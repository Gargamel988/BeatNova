import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { useResponsive } from '@/hooks/useResponsive';
import { useThemeModeContext } from '@/providers/theme-provider';
import { 
  Bell, 
  Volume2, 
  Wifi, 
  ChevronRight,
  BarChart3,
  Palette,
  Repeat,
  Shuffle,
  LogOut,
  PlayCircle
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { useAudioPlayerContext } from '@/providers/player-context';

export default function Settings() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const textPrimary = useColor('authPrimaryText');
  const textSecondary = useColor('authSecondaryText');
  const cardBg = useColor('card');
  const [notifications, setNotifications] = useState(true);
  const [soundNormalization, setSoundNormalization] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loopMode, setLoopMode] = useState<'all' | 'one' | 'none'>('all');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();
  const { shuffle: audioShuffle } = useAudioPlayerContext();

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showToggle = false, 
    toggleValue = false, 
    onToggleChange 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={showToggle}
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(16),
        padding: wp(4),
        marginBottom: hp(1.5),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: wp(12),
          height: wp(12),
          borderRadius: radius(12),
          backgroundColor: palette.purple + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: wp(3),
        }}
      >
        <Icon size={wp(6)} color={palette.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize(15),
            fontWeight: '600',
            color: textPrimary,
            marginBottom: hp(0.3),
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize(13),
              color: textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: '#767577', true: palette.purple }}
          thumbColor={toggleValue ? '#FFFFFF' : '#f4f3f4'}
        />
      ) : (
        <ChevronRight size={wp(5)} color={textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: wp(4),
          paddingTop: hp(2.5),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: fontSize(28),
              fontWeight: '700',
              color: textPrimary,
              marginBottom: hp(0.5),
            }}
          >
            Ayarlar
          </Text>
          <Text
            style={{
              fontSize: fontSize(14),
              color: textSecondary,
            }}
          >
            Uygulamayı kişiselleştir
          </Text>
        </View>

        {/* Genel Section */}
        <Text
          style={{
            fontSize: fontSize(16),
            fontWeight: '600',
            color: textPrimary,
            marginBottom: hp(1.5),
            marginTop: hp(1),
          }}
        >
          Genel
        </Text>

        <SettingItem
          icon={Bell}
          title="Bildirimler"
          showToggle
          toggleValue={notifications}
          onToggleChange={setNotifications}
        />

        <SettingItem
          icon={Palette}
          title="Tema"
          subtitle="Görünümü değiştir"
          onPress={() => {
            router.push('/(drawer)/Theme');
          }}
        />

        <SettingItem
          icon={BarChart3}
          title="İstatistikler"
          subtitle="Dinleme istatistikleriniz"
          onPress={() => {
            router.push('/(drawer)/Statistic');
          }}
        />

        {/* Oynatma Section */}
        <Text
          style={{
            fontSize: fontSize(16),
            fontWeight: '600',
            color: textPrimary,
            marginBottom: hp(1.5),
            marginTop: hp(2),
          }}
        >
          Oynatma
        </Text>

        <SettingItem
          icon={Volume2}
          title="Ses Normalleştirme"
          subtitle="Tüm şarkıları aynı ses seviyesinde çal"
          showToggle
          toggleValue={soundNormalization}
          onToggleChange={setSoundNormalization}
        />

        <SettingItem
          icon={PlayCircle}
          title="Otomatik Oynatma"
          subtitle="Şarkı seçildiğinde otomatik başlat"
          showToggle
          toggleValue={autoPlay}
          onToggleChange={setAutoPlay}
        />

        <SettingItem
          icon={Repeat}
          title="Tekrar Modu"
          subtitle={loopMode === 'all' ? 'Tüm liste' : loopMode === 'one' ? 'Tek şarkı' : 'Kapalı'}
          onPress={() => {
            const modes: ('all' | 'one' | 'none')[] = ['all', 'one', 'none'];
            const currentIndex = modes.indexOf(loopMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            const nextMode = modes[nextIndex];
            setLoopMode(nextMode);
            toast({
              title: "Tekrar Modu",
              description: nextMode === 'all' ? 'Tüm liste tekrarlanacak' : nextMode === 'one' ? 'Tek şarkı tekrarlanacak' : 'Tekrar kapalı',
              variant: "default",
            });
          }}
        />

        <SettingItem
          icon={Shuffle}
          title="Karıştır"
          subtitle="Şarkıları rastgele sırayla çal"
          showToggle
          toggleValue={shuffleEnabled}
          onToggleChange={(value) => {
            setShuffleEnabled(value);
            audioShuffle(value);
            toast({
              title: value ? "Karıştır Açık" : "Karıştır Kapalı",
              description: value ? "Şarkılar rastgele sırayla çalınacak" : "Şarkılar normal sırayla çalınacak",
              variant: "default",
            });
          }}
        />

        <SettingItem
          icon={Wifi}
          title="Çevrimdışı Mod"
          subtitle="İnternet olmadan dinle"
          showToggle
          toggleValue={offlineMode}
          onToggleChange={setOfflineMode}
        />
        <SettingItem
          icon={LogOut}
          title="çıkış yap"
          onPress={async () => {
            if (isLoggingOut) return;
            
            setIsLoggingOut(true);
            try {
              await logout();
              toast({
                title: "Başarılı",
                description: "Başarıyla çıkış yapıldı",
                variant: "success",
              });
            } catch (error: any) {
              toast({
                title: "Hata",
                description: error?.message || "Çıkış yapılırken bir hata oluştu",
                variant: "error",
              });
            } finally {
              setIsLoggingOut(false);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}