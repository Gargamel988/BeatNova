import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { useResponsive } from '@/hooks/useResponsive';
import { AlertCircle, RefreshCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';
import { Icon } from './ui/icon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Burada error logging servisine gönderebilirsiniz (Sentry, LogRocket, vb.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    router.replace('/(drawer)/(tabs)');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        onReset={this.handleReset}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  onGoHome: () => void;
}

function ErrorFallback({ error, onReset, onGoHome }: ErrorFallbackProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor('card');
  const textPrimary = useColor('authPrimaryText');
  const textSecondary = useColor('authSecondaryText');
  const accent = useColor('accent');
  const borderColor = useColor('border');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: wp(5),
          gap: hp(2),
        }}
      >
        <View
          style={{
            width: wp(20),
            height: wp(20),
            borderRadius: radius(20),
            backgroundColor: cardBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: borderColor,
            marginBottom: hp(1),
          }}
        >
          <Icon name={AlertCircle} size={wp(10)} color={textSecondary} />
        </View>

        <Text
          style={{
            fontSize: fontSize(24),
            fontWeight: '700',
            color: textPrimary,
            textAlign: 'center',
            marginBottom: hp(0.5),
          }}
        >
          Bir Hata Oluştu
        </Text>

        <Text
          style={{
            fontSize: fontSize(14),
            color: textSecondary,
            textAlign: 'center',
            lineHeight: fontSize(20),
            marginBottom: hp(2),
          }}
        >
          {error?.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
        </Text>

        <View style={{ gap: hp(1.5), width: '100%', maxWidth: wp(80) }}>
          <TouchableOpacity
            onPress={onReset}
            activeOpacity={0.8}
            style={{
              backgroundColor: accent,
              paddingHorizontal: wp(6),
              paddingVertical: hp(1.5),
              borderRadius: radius(12),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: wp(2),
            }}
          >
            <Icon name={RefreshCw} size={wp(5)} color="white" />
            <Text
              style={{
                color: 'white',
                fontSize: fontSize(14),
                fontWeight: '600',
              }}
            >
              Tekrar Dene
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onGoHome}
            activeOpacity={0.8}
            style={{
              backgroundColor: cardBg,
              paddingHorizontal: wp(6),
              paddingVertical: hp(1.5),
              borderRadius: radius(12),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: wp(2),
              borderWidth: 1,
              borderColor: borderColor,
            }}
          >
            <Icon name={Home} size={wp(5)} color={textPrimary} />
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(14),
                fontWeight: '600',
              }}
            >
              Ana Sayfaya Dön
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

