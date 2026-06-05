import type { ReactNode } from "react";
import { Linking, Pressable, Text } from "react-native";

type Props = {
  href: string;
  children: ReactNode;
};

export function ExternalLink({ href, children }: Props) {
  return (
    <Pressable onPress={() => Linking.openURL(href)}>
      <Text style={{ color: "#1b95ff" }}>{children}</Text>
    </Pressable>
  );
}
