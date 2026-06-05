import * as Haptics from "@/utils/haptics";
import { Award, Bell, Users } from "lucide-react-native";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

interface OnboardingViewProps {
  onFinished: () => void;
}

const steps = [
  {
    title: "ASSIGN ROLES",
    description:
      "Step into the orbital ship. Will you be a diligent Crewmate repairing systems, or the deadly Imposter hiding in shadows?",
    Icon: Users,
    accentColor: Theme.colors.accentCyan,
    gradientColors: Theme.gradients.cyan,
  },
  {
    title: "EMERGENCY MEETINGS",
    description:
      "Spotted someone venting or acting sus? Smash the Emergency Button to assemble the agents in the cafeteria and discuss in real-time.",
    Icon: Bell,
    accentColor: Theme.colors.accentRed,
    gradientColors: Theme.gradients.red,
  },
  {
    title: "DEDUCT & EJECT",
    description:
      "Review details, cast your votes, and eject suspects! Crewmates win by ejecting all Imposters or finishing all tasks. Imposters win by secret takeovers.",
    Icon: Award,
    accentColor: Theme.colors.accentGold,
    gradientColors: ["#FFD700", "#FFA500"] as [string, string],
  },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onFinished,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onFinished();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinished();
  };

  const active = steps[currentStep];
  const StepIcon = active.Icon;

  return (
    <LinearGradient
      colors={Theme.gradients.bg}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Dynamic ambient top glow matching slide color */}
      <View
        style={[
          styles.glow,
          { backgroundColor: active.accentColor, opacity: 0.12 },
        ]}
      />

      {/* Header Skip button */}
      <View style={styles.header}>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      </View>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        {/* Graphical Icon Card */}
        <View style={styles.iconWrapper}>
          <View
            style={[styles.blurShadow, { backgroundColor: active.accentColor }]}
          />

          <GlassCard
            style={styles.iconCard}
            cornerRadius={30}
            borderOpacity={0.4}
          >
            <LinearGradient
              colors={["#FFFFFF", active.accentColor]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <StepIcon
                size={64}
                color={Theme.colors.bgPrimary}
                strokeWidth={1.5}
              />
            </LinearGradient>
          </GlassCard>
        </View>

        {/* Text Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{active.title}</Text>
          <Text style={styles.description}>{active.description}</Text>
        </View>
      </View>

      {/* Footer Paging and Button Actions */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pager}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    currentStep === idx
                      ? active.accentColor
                      : "rgba(255, 255, 255, 0.2)",
                  width: currentStep === idx ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <NeonButton
          title={currentStep === steps.length - 1 ? "GET STARTED" : "CONTINUE"}
          gradientColors={active.gradientColors}
          onPress={handleNext}
          hapticStyle="light"
          style={styles.actionBtn}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  glow: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    top: -width * 0.4,
    left: -width * 0.1,
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginTop: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  blurShadow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.15,
  },
  iconCard: {
    width: 160,
    height: 160,
    borderRadius: 30,
    overflow: "hidden",
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionBtn: {
    width: width - 48,
  },
});
export default OnboardingView;
