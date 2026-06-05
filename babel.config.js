module.exports = {
  presets: ["@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        root: ["./"],
        alias: {
          "@": "./src",
          "@/assets": "./assets",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
