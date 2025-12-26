import React from 'react'
import { Drawer } from 'expo-router/drawer'
import DrawerContent from '@/components/DrawerContent'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function _layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={(drawerProps) => <DrawerContent {...drawerProps} />}
        screenOptions={{ 
          headerShown: false, 
          sceneStyle: { backgroundColor: 'transparent' },
          drawerStyle: {
            width: '85%',
          },
          drawerType: 'slide',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
        }} 
      >
        <Drawer.Screen name="(tabs)" options={{ title: 'Ana Sayfa', drawerLabel: 'Ana Sayfa' }} />
        <Drawer.Screen name="Favorite" options={{ title: 'Favoriler', drawerLabel: 'Favoriler' }} />
        <Drawer.Screen name="Friends" options={{ title: 'Arkadaşlar', drawerLabel: 'Arkadaşlar' }} />
        <Drawer.Screen name="Profile" options={{ title: 'Profil', drawerLabel: 'Profil' }} />
        <Drawer.Screen name="Statistic" options={{ title: 'İstatistikler', drawerLabel: 'İstatistikler' }} />
        <Drawer.Screen name="Theme" options={{ title: 'Tema Önizleme', drawerLabel: 'Tema Önizleme' }} />
      </Drawer>
    </GestureHandlerRootView>
  )
}