
import { useWindowDimensions } from "react-native";

const DEVICE_TYPES = {
	PHONE: 'phone',
	TABLET: 'tablet',
  } as const;
  
  // Temel referans boyutları
  const BASE_DIMENSIONS = {
	phone: {
	  width: 375,  // iPhone X base
	  height: 812,
	},
	tablet: {
	  width: 768,  // iPad base
	  height: 1024,
	},
  } as const;

export function useResponsive() {
	const {width, height} = useWindowDimensions();
	const deviceType = width < 768 ? DEVICE_TYPES.PHONE : DEVICE_TYPES.TABLET;
  const isPhone = deviceType === DEVICE_TYPES.PHONE;
  const isTablet = deviceType === DEVICE_TYPES.TABLET;
const wp = (percentage: number) => {
	if (isPhone) {
		return (width * percentage) / 100;
	} else if (isTablet) {
		return (width * percentage) / 100;
	}
	return (width * percentage) / 100;
};

const hp = (percentage: number) => {
	if (isPhone) {
		return (height * percentage) / 100;
	} else if (isTablet) {
		return (height * percentage) / 100;
	}
	return (height * percentage) / 100;
};

const fontSize = (size: number): number => {
    const baseWidth = isPhone 
      ? BASE_DIMENSIONS.phone.width 
      : BASE_DIMENSIONS.tablet.width;
    
    const scale = width / baseWidth;
    
    if (isPhone) {
      // Telefonda daha dar aralık
      return Math.min(Math.max(size * scale, size * 0.85), size * 1.3);
    } else {
      // Tablet'te daha geniş ama kontrollü
      return Math.min(Math.max(size * scale, size * 1.0), size * 1.5);
    }
  };
  const radius = (size: number): number => {
    if (isPhone) {
      return size;
    } else {
      // Tablet'te radius'u artır
      return size * 1.3;
    }
  };

  return { wp, hp, fontSize, radius };
}