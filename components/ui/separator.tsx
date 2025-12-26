import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import React from 'react';
import { ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

export function Separator({
  orientation = 'horizontal',
  style,
}: SeparatorProps) {
  const borderColor = useColor('border');
  const { wp, hp } = useResponsive();

  return (
    <View className="flex-row items-center justify-center">
    <View
      style={[
        {
          backgroundColor: borderColor,
          ...(orientation === 'horizontal'
            ? { height: 1, width: wp(40)}
            : { width: 1, height: hp(100)}),
        },
        style,
      ]}
    />
    <Text className="text-white mx-2 text-sm">veya</Text>
    <View
      style={[
        {
          backgroundColor: borderColor,
          ...(orientation === 'horizontal'
            ? { height: 1, width: wp(40)}
            : { width: 1, height: hp(100)}),
        },
        style,
      ]}
    />
    </View>
  );
}
