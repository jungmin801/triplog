import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { Text } from "./Text";

const ANDROID_NAV_BAR_HEIGHT = 56;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 수정 (작성자만 가능) */
  onEdit?: () => void;
  /** 삭제 (작성자 또는 Journey owner) */
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
};

export function MemoryMenuSheet({
  visible,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: Props) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
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
          {canEdit && onEdit ? (
            <Pressable
              className="flex-row items-center gap-3 py-3 active:opacity-70"
              onPress={() => {
                onClose();
                onEdit();
              }}
            >
              <Ionicons name="pencil-outline" size={22} color="#1a1f2b" />
              <Text className="text-body font-semibold text-ink">수정</Text>
            </Pressable>
          ) : null}
          {canDelete ? (
            <Pressable
              className="flex-row items-center gap-3 py-3 active:opacity-70"
              onPress={() => {
                onClose();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#dc2626" />
              <Text className="text-body font-semibold text-red-600">삭제</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
