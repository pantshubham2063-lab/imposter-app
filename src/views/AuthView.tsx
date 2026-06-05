import * as Haptics from "@/utils/haptics";
import {
  Lock,
  Mail,
  Rocket,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { NeonButton } from "../components/NeonButton";
import { useGame } from "../context/GameContext";
import { Theme } from "../theme/Theme";

const { width } = Dimensions.get("window");

export const AuthView: React.FC = () => {
  const { login, register } = useGame();

  // Form state
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Field focus states (for neon styling)
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Refs to allow clicking the container to focus inputs
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleAuth = async () => {
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Basic Validations
    if (!email.includes("@")) {
      setErrorMsg("Invalid email format.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (isSignUpMode) {
      if (!username) {
        setErrorMsg("Username is required.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      if (isSignUpMode) {
        await register(cleanEmail, username.trim(), cleanPassword);
      } else {
        await login(cleanEmail, cleanPassword);
      }
    } catch (e: any) {
      setErrorMsg(
        e.message || "Connection failed. Make sure the server is running.",
      );
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={Theme.gradients.bg}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background Neon Orbs (pointerEvents set to none so they do not intercept touches) */}
      <View pointerEvents="none" style={[styles.glowOrb, styles.orbLeft]} />
      <View pointerEvents="none" style={[styles.glowOrb, styles.orbRight]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Rocket
            size={42}
            color={Theme.colors.accentCyan}
            strokeWidth={1.5}
            style={styles.logo}
          />
          <Text style={styles.title}>IMPOSTER</Text>
          <Text style={styles.subtitle}>MULTIPLAYER ORBITAL DEDUCTION</Text>
        </View>

        {/* Custom Segmented Tab */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, !isSignUpMode && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSignUpMode(false);
              setErrorMsg(null);
            }}
          >
            <Text
              style={[styles.tabText, !isSignUpMode && styles.activeTabText]}
            >
              LOGIN
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, isSignUpMode && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSignUpMode(true);
              setErrorMsg(null);
            }}
          >
            <Text
              style={[styles.tabText, isSignUpMode && styles.activeTabText]}
            >
              SIGN UP
            </Text>
          </Pressable>
        </View>

        {/* frosted Card Inputs Form */}
        <GlassCard
          style={styles.formCard}
          cornerRadius={24}
          borderOpacity={0.4}
        >
          {isSignUpMode && (
            <View style={styles.inputWrapper}>
              <Pressable
                style={[
                  styles.inputContainer,
                  focusedField === "username" && styles.focusedInput,
                ]}
                onPress={() => usernameRef.current?.focus()}
              >
                <UserIcon
                  size={18}
                  color={
                    focusedField === "username"
                      ? Theme.colors.accentCyan
                      : "#64748B"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={usernameRef}
                  placeholder="Username"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                />
              </Pressable>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Pressable
              style={[
                styles.inputContainer,
                focusedField === "email" && styles.focusedInput,
              ]}
              onPress={() => emailRef.current?.focus()}
            >
              <Mail
                size={18}
                color={
                  focusedField === "email" ? Theme.colors.accentCyan : "#64748B"
                }
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailRef}
                placeholder="Email Address"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </Pressable>
          </View>

          <View style={styles.inputWrapper}>
            <Pressable
              style={[
                styles.inputContainer,
                focusedField === "password" && styles.focusedInput,
              ]}
              onPress={() => passwordRef.current?.focus()}
            >
              <Lock
                size={18}
                color={
                  focusedField === "password"
                    ? Theme.colors.accentCyan
                    : "#64748B"
                }
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
            </Pressable>
          </View>

          {isSignUpMode && (
            <View style={styles.inputWrapper}>
              <Pressable
                style={[
                  styles.inputContainer,
                  focusedField === "confirmPassword" && styles.focusedInput,
                ]}
                onPress={() => confirmPasswordRef.current?.focus()}
              >
                <Lock
                  size={18}
                  color={
                    focusedField === "confirmPassword"
                      ? Theme.colors.accentCyan
                      : "#64748B"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordRef}
                  placeholder="Confirm Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                />
              </Pressable>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorContainer}>
              <ShieldAlert
                size={14}
                color={Theme.colors.accentRed}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <NeonButton
            title={isSignUpMode ? "CREATE AGENT PROFILE" : "ENTER  SHIPS"}
            gradientColors={
              isSignUpMode ? Theme.gradients.red : Theme.gradients.cyan
            }
            onPress={handleAuth}
            style={styles.submitBtn}
          />
        </GlassCard>

        {/* Divider separator */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONNECT WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Apple Login Mock */}
        <Pressable
          style={styles.appleBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsLoading(true);
            setTimeout(() => {
              login("apple_agent@imposter.app", "AppleAgent");
            }, 1000);
          }}
        >
          <Text style={styles.appleBtnText}> Sign In with Apple</Text>
        </Pressable>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <GlassCard style={styles.loadingCard} cornerRadius={20}>
            <ActivityIndicator size="large" color={Theme.colors.accentCyan} />
            <Text style={styles.loadingText}>
              ESTABLISHING ENCRYPTED SIGNAL...
            </Text>
          </GlassCard>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowOrb: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.15,
  },
  orbLeft: {
    backgroundColor: Theme.colors.accentCyan,
    top: -50,
    left: -50,
  },
  orbRight: {
    backgroundColor: Theme.colors.accentRed,
    bottom: 50,
    right: -50,
  },
  scrollContent: {
    paddingVertical: 40,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 40,
  },
  logo: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
  },
  tabContainer: {
    flexDirection: "row",
    width: width - 48,
    height: 46,
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: Theme.colors.surfaceDark,
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.4)",
    shadowColor: Theme.colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 1,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  formCard: {
    width: width - 48,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(44, 54, 77, 0.5)",
    paddingHorizontal: 16,
    height: 52,
  },
  focusedInput: {
    borderColor: Theme.colors.accentCyan,
    shadowColor: Theme.colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  errorText: {
    color: Theme.colors.accentRed,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: width - 96,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dividerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Theme.colors.textMuted,
    paddingHorizontal: 12,
    letterSpacing: 1.5,
  },
  appleBtn: {
    width: width - 48,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  appleBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    width: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 16,
  },
});
export default AuthView;
