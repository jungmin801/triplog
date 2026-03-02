import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { Text } from "./Text";

const ANDROID_NAV_BAR_HEIGHT = 56;

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  onJoin: () => void;
};

export function JourneyAddOrJoinSheet({
  visible,
  onClose,
  onAdd,
  onJoin,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/10" onPress={onClose}>
        <Pressable
          className="bg-surface rounded-t-2xl px-space-card pt-2 pb-8"
          style={
            Platform.OS === "android"
              ? { paddingBottom: 32 + ANDROID_NAV_BAR_HEIGHT }
              : undefined
          }
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-10 h-1 rounded-pill bg-ink/20 self-center mb-4" />
          <Pressable
            className="flex-row items-center gap-3 py-3 active:opacity-70"
            onPress={() => {
              onClose();
              onAdd();
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color="#1a1f2b" />
            <Text className="text-body font-semibold text-ink">여정 추가하기</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center gap-3 py-3 active:opacity-70"
            onPress={() => {
              onClose();
              onJoin();
            }}
          >
            <Ionicons name="people-outline" size={22} color="#1a1f2b" />
            <Text className="text-body font-semibold text-ink">여정 참여하기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
