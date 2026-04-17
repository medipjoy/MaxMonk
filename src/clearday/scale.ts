import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const BASE_WIDTH = 375;

export function moderateScale(size: number, factor = 0.5): number {
  return size + (width / BASE_WIDTH - 1) * size * factor;
}

export function fontScale(size: number, multiplier = 1.0): number {
  return moderateScale(size) * multiplier;
}
