import useMember from "@/hooks/useMember";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Avatar } from "./Avatar";

type HeaderCenter =
  | { kind: "logo" }
  | { kind: "title"; title: string; subtitle?: string };

type HeaderProps = {
  // left
  showBack?: boolean;
  onPressBack?: () => void;

  // center
  center?: HeaderCenter;

  // right
  showAvatar?: boolean;
  rightSlot?: React.ReactNode;

  // layout
  padded?: boolean;
};

export function Header({
  showBack = false,
  onPressBack,
  center = { kind: "logo" },
  showAvatar = true,
  rightSlot,
  padded = true,
}: HeaderProps) {
  const { member } = useMember();
  return (
    <View
      className={[
        "flex-row items-center py-space-card",
        padded ? "px-space-card" : "",
      ].join(" ")}
    >
      <View className="w-12 items-start">
        {showBack ? (
          <Pressable
            onPress={onPressBack}
            className="w-8 h-8 rounded-pill overflow-hidden bg-surface-alt border border-ink/5 items-center justify-center p-2"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={18} color="#6B7280" />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 items-center">
        {center.kind === "logo" ? (
          <Image
            source={require("../assets/images/logo.png")}
            resizeMode="contain"
            style={{
              width: 64,
              height: 24,
            }}
          />
        ) : (
          <>
            <Text className="text-lg font-semibold text-ink">
              {center.title}
            </Text>
            {center.subtitle && (
              <Text className="text-body-sm text-ink/60">
                {center.subtitle}
              </Text>
            )}
          </>
        )}
      </View>

      <View className="w-12 items-end">
        {rightSlot ? (
          rightSlot
        ) : showAvatar ? (
          <Avatar
            source={member?.avatar_url}
            size="sm"
            fallback={member?.display_name ?? "회원님"}
          />
        ) : null}
      </View>
    </View>
  );
}

export default Header;
