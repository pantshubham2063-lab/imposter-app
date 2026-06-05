import * as Haptics from "@/utils/haptics";
import React from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Theme } from "../theme/Theme";

interface NeonButtonProps {
  onPress: () => void;
  title: string;
  gradientColors?: [string, string];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  hapticStyle?: "light" | "medium" | "heavy" | "success" | "warning" | "error";
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  onPress,
  title,
  gradientColors = Theme.gradients.cyan,
  style,
  textStyle,
  disabled = false,
  hapticStyle = "light",
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();

    // Play subtle haptic feedback on touch down
    if (hapticStyle === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (hapticStyle === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (hapticStyle === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (hapticStyle === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (hapticStyle === "warning") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (hapticStyle === "error") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          disabled && styles.disabledButton,
        ]}
      >
        <LinearGradient
          colors={disabled ? ["#1e293b", "#0f172a"] : gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            style={[styles.text, textStyle, disabled && styles.disabledText]}
          >
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  disabledText: {
    color: "#64748B",
  },
});
export default NeonButton;
