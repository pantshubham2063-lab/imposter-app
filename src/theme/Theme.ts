export const Theme = {
  colors: {
    // 60% Primary Backgrounds
    bgPrimary: "#080B11",
    bgSecondary: "#0C101A",
    bgDarkest: "#05070B",

    // 30% Secondary Surfaces
    surfaceDark: "#151A26",
    surfaceLight: "#202738",
    surfaceGlass: "#151A26",
    borderAccent: "#2C364D",

    // 10% Accent/Highlight Colors
    accentCyan: "#00E5FF", // Safe / Crewmate
    accentRed: "#FF4D4D", // Alert / Imposter
    accentGold: "#FFD700", // Victory / Level Up
    accentGreen: "#10B981", // Ready status
    textPrimary: "#FFFFFF",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
  },

  gradients: {
    bg: ["#080B11", "#0C101A", "#05070B"] as [string, string, string],
    cyan: ["#00E5FF", "#00A3FF"] as [string, string],
    red: ["#FF6B6B", "#FF4D4D"] as [string, string],
    dark: ["#202738", "#151A26"] as [string, string],
    glass: ["rgba(44, 54, 77, 0.4)", "rgba(21, 26, 38, 0.2)"] as [
      string,
      string,
    ],
    gold: ["#FFD700", "#FFC700"] as [string, string],
  },

  fonts: {
    system: "System",
    black: "System",
    bold: "System",
    medium: "System",
  },
};
