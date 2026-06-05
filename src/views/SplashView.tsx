import { Rocket } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

interface SplashViewProps {
  onFinished: () => void;
}

const loadingTexts = [
  "BOOTING QUANTUM SHIPS...",
  "CONNECTING TO SPACECRAFT ENGINE...",
  "PREPARING CREW LISTS...",
  "SPAWNING THE IMPOSTERS...",
];

export const SplashView: React.FC<SplashViewProps> = ({ onFinished }) => {
  const [currentTextIdx, setCurrentTextIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.95)).current;
  const textOffset = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // 1. Entrance animation (Spring logo & Title)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1.0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1.0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(textOffset, {
        toValue: 0,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Loop glowing pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 0.95,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // 3. Text rotater
    const textInterval = setInterval(() => {
      setCurrentTextIdx((prev) => {
        if (prev < loadingTexts.length - 1) {
          return prev + 1;
        }
        clearInterval(textInterval);
        return prev;
      });
    }, 900);

    // 4. Progress loader
    const start = Date.now();
    const duration = 3000; // 3 seconds total loading
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1.0);
      setProgress(pct);

      if (pct >= 1.0) {
        clearInterval(progressInterval);
        setTimeout(() => {
          onFinished();
        }, 500); // Small delay for premium feel
      }
    }, 30);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <LinearGradient
      colors={Theme.gradients.bg}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Radiant glow backdrop overlay */}
      <View style={styles.radialGlow} />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          {/* pulsating back glow shadow */}
          <Animated.View
            style={[styles.pulseGlow, { transform: [{ scale: pulseScale }] }]}
          />

          {/* Logo Frame */}
          <Animated.View
            style={[
              styles.logoFrame,
              {
                scaleX: logoScale,
                scaleY: logoScale,
                opacity: logoOpacity,
              },
            ]}
          >
            <LinearGradient colors={Theme.gradients.dark} style={styles.logoBg}>
              <Rocket
                size={48}
                color={Theme.colors.accentCyan}
                strokeWidth={1.5}
              />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Game Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: textOffset }],
            },
          ]}
        >
          <Text style={styles.title}>IMPOSTER</Text>
          <Text style={styles.subtitle}>DEDUCT. SURVIVE. CONQUER.</Text>
        </Animated.View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>{loadingTexts[currentTextIdx]}</Text>

        {/* custom capsule progress bar */}
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={Theme.gradients.cyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: (width - 120) * progress },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  radialGlow: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    top: "25%",
    left: "-25%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  pulseGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255, 77, 77, 0.15)",
  },
  logoFrame: {
    width: 110,
    height: 110,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Theme.colors.borderAccent,
    overflow: "hidden",
    shadowColor: Theme.colors.accentRed,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  logoBg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 8,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: Theme.colors.accentCyan,
    letterSpacing: 4,
    marginTop: 8,
    opacity: 0.8,
  },
  progressContainer: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 60,
  },
  progressText: {
    fontSize: 10,
    fontFamily: "System",
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  progressBarBg: {
    width: width - 120,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceDark,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    shadowColor: Theme.colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
export default SplashView;
