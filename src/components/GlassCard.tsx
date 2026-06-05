import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Theme } from '../theme/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  cornerRadius?: number;
  borderOpacity?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  cornerRadius = 16,
  borderOpacity = 0.5,
  padding = 16,
}) => {
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: cornerRadius,
          padding,
          borderColor: `rgba(44, 54, 77, ${borderOpacity})`,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(21, 26, 38, 0.75)',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
export default GlassCard;
