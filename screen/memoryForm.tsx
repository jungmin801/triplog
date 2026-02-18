import { Button, Input } from "@/components";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const MOOD_OPTIONS = [
  { key: "very_bad", emoji: "😢", label: "아주 나쁨" },
  { key: "bad", emoji: "😕", label: "나쁨" },
  { key: "neutral", emoji: "😐", label: "보통" },
  { key: "good", emoji: "😊", label: "좋음" },
  { key: "very_good", emoji: "🤩", label: "아주 좋음" },
] as const;

export default function MemoryForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [moods, setMoods] = useState<string>();

  const toggleMood = (key: string) => {
    setMoods(key);
  };

  const handleSubmit = () => {
    // TODO: save post and go back
    router.back();
  };

  return (
    <View style={{ flex: 1 }} className="bg-surface">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{ kind: "title", title: "New Memory" }}
          showAvatar={false}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-space-card pb-32 pt-space-section">
            <Text className="text-h1 font-bold text-ink mb-1">New Memory</Text>
            <Text className="text-body text-ink/60 mb-4">
              새로운 기억을 추가하세요.
            </Text>
            <Input
              label="TITLE"
              placeholder="e.g. Sunset at the Golden Pavilion"
              value={title}
              onChangeText={setTitle}
              containerClassName="mb-5"
            />

            <View className="mb-5">
              <Text className="text-overline font-bold text-ink/40 mb-1.5">
                STORY
              </Text>
              <TextInput
                className="rounded-input border-2 border-ink/5 bg-background px-space-card py-space-card min-h-[100px] text-body text-ink placeholder:text-ink/30"
                placeholder="What happened? Share your experience..."
                placeholderTextColor="#9ca3af"
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Mood (5단계, 다중 선택) */}
            <View className="mb-5">
              <Text className="text-overline font-bold text-ink/40 mb-1.5">
                MOOD
              </Text>
              <View className="flex-row gap-2">
                {MOOD_OPTIONS.map(({ key, emoji, label }) => {
                  const isSelected = moods === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => toggleMood(key)}
                      className={`flex-1 flex-col items-center justify-center rounded-btn border-2 py-3 active:opacity-80 min-h-[72px] ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-ink/10 bg-background"
                      }`}
                    >
                      <Text className="text-3xl mb-1">{emoji}</Text>
                      <Text
                        className={`text-caption font-semibold ${
                          isSelected ? "text-primary" : "text-ink/70"
                        }`}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Photo placeholder */}
            <Text className="text-overline font-bold text-ink/40 mb-1.5">
              PHOTO
            </Text>
            <Pressable
              className="mb-8 rounded-card border-2 border-dashed bg-surface-alt items-center justify-center h-40 active:opacity-70"
              style={{ borderColor: "rgba(26, 31, 43, 0.2)" }}
            >
              <Ionicons name="image-outline" size={40} color="#9ca3af" />
              <Text className="text-body-sm text-ink/50 mt-2">Add photo</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
          className="bg-surface pt-4 px-space-card"
        >
          <SafeAreaView edges={["bottom"]}>
            <View className="flex-row justify-center px-space-card pb-space-section">
              <Button
                onPress={() => router.back()}
                variant="primary"
                size="md"
                className="w-full"
              >
                Save Memory
              </Button>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
}
