import { Vibration } from "react-native";

export enum ImpactFeedbackStyle {
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
}

export enum NotificationFeedbackType {
  Success = "success",
  Warning = "warning",
  Error = "error",
}

export async function impactAsync(_style: ImpactFeedbackStyle) {
  Vibration.vibrate(10);
}

export async function notificationAsync(_type: NotificationFeedbackType) {
  Vibration.vibrate(20);
}
