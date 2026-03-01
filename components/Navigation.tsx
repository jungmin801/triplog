import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Platform, Pressable, View } from "react-native";
import { Text } from "./Text";

const ANDROID_NAV_BAR_HEIGHT = 56;

export type NavTab = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
};

export type NavigationProps = {
  tabs: NavTab[];
  activeKey: string;
  onTabPress: (href: Href) => void;
  className?: string;
};

export function Navigation({
  tabs,
  activeKey,
  onTabPress,
  className = "",
}: NavigationProps) {
  return (
    <View
      className={`flex-row items-center justify-around bg-background/80 border-t border-ink/5 py-2 ${className}`}
      style={
        Platform.OS === "android"
          ? { paddingBottom: ANDROID_NAV_BAR_HEIGHT }
          : undefined
      }
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.href)}
            className="items-center justify-center py-2 px-4 min-w-[64px] active:opacity-70"
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={isActive ? "#ee845d" : "#6B7280"}
              style={{ marginBottom: 4 }}
            />
            <Text
              className={`text-caption font-semibold ${isActive ? "text-primary" : "text-ink/60"}`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
