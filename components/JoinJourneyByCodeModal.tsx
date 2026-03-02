import {
  joinJourneyByInviteCode,
  journeyQueryKeys,
  MAX_JOURNEY_MEMBERS,
} from "@/lib/journeyQueries";
import { profileQueryKeys } from "@/lib/profileQueries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { Text } from "./Text";

const ANDROID_NAV_BAR_HEIGHT = 56;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function JoinJourneyByCodeModal({ visible, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const joinMutation = useMutation({
    mutationFn: joinJourneyByInviteCode,
    onSuccess: (journeyId) => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
      onClose();
      setCode("");
      setLocalError(null);
      router.push(`/journeys/${journeyId}` as Href);
    },
    onError: (err: Error) => {
      if (err.message === "FULL") {
        setLocalError(
          `참여 인원이 가득 찼어요. (최대 ${MAX_JOURNEY_MEMBERS}명까지 참여할 수 있어요)`,
        );
      } else if (err.message === "ALREADY_MEMBER") {
        setLocalError("이미 참여 중인 여정이에요.");
      } else {
        setLocalError("유효하지 않은 코드예요. 코드를 다시 확인해 주세요.");
      }
    },
  });

  const onSubmit = useCallback(() => {
    setLocalError(null);
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setLocalError("6자리 숫자 코드를 입력해 주세요.");
      return;
    }
    joinMutation.mutate(digits);
  }, [code, joinMutation]);

  const onCloseAndReset = useCallback(() => {
    onClose();
    setCode("");
    setLocalError(null);
    joinMutation.reset();
  }, [onClose, joinMutation]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCloseAndReset}
    >
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onCloseAndReset}
      >
        <Pressable
          className="bg-surface rounded-t-2xl px-space-card pt-4 pb-8"
          style={
            Platform.OS === "android"
              ? { paddingBottom: 32 + ANDROID_NAV_BAR_HEIGHT }
              : undefined
          }
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-10 h-1 rounded-pill bg-ink/20 self-center mb-4" />
          <Text className="text-h3 font-bold text-ink mb-1">
            여정 참여하기
          </Text>
          <Text className="text-body text-ink/60 mb-4">
            6자리 초대 코드를 입력해 주세요.
          </Text>

          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, "").slice(0, 6));
              setLocalError(null);
            }}
            placeholder="000000"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            className="bg-background border-2 border-ink/10 rounded-input px-4 h-12 text-body font-semibold text-ink text-center tracking-[0.3em]"
          />

          {localError ? (
            <Text className="text-body-sm text-red-600 mt-2">{localError}</Text>
          ) : null}

          <View className="flex-row gap-3 mt-6">
            <Pressable
              className="flex-1 h-12 rounded-input border-2 border-ink/10 items-center justify-center active:opacity-70"
              onPress={onCloseAndReset}
            >
              <Text className="text-body font-semibold text-ink">취소</Text>
            </Pressable>
            <Pressable
              className="flex-1 h-12 rounded-input bg-primary items-center justify-center active:opacity-70 disabled:opacity-50"
              onPress={onSubmit}
              disabled={joinMutation.isPending || code.replace(/\D/g, "").length !== 6}
            >
              {joinMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-body font-semibold text-white">참여하기</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
