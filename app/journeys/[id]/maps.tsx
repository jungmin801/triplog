import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

const MOCK_TIMELINE = [
  {
    id: "1",
    date: "Day 1 · Aug 12",
    title: "Kyoto Temple Trail",
    subtitle: "Japan • 4 Days Guide",
    imageUri:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400",
  },
  {
    id: "2",
    date: "Day 2 · Aug 13",
    title: "Golden Pavilion",
    subtitle: "Kinkaku-ji morning light",
    imageUri:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
  },
  {
    id: "3",
    date: "Day 3 · Aug 14",
    title: "Arashiyama Bamboo",
    subtitle: "Walking the bamboo grove",
    imageUri: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400",
  },
];

const MOCK_FOLDERS: Record<string, { title: string }> = {
  default: { title: "Venice Getaway" },
  "1": { title: "Venice Getaway" },
  "2": { title: "Kyoto Serenity" },
};

export default function FolderRoute() {
  const router = useRouter();
  const { id = "default" } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();
  const folder = MOCK_FOLDERS[id] ?? MOCK_FOLDERS.default;

  const mapHeight = Math.min(height * 0.36, 280);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-space-card py-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-pill bg-background border border-ink/10 items-center justify-center active:opacity-70"
          >
            <Ionicons name="chevron-back" size={22} color="#1a1f2b" />
          </Pressable>
          <Text className="text-body font-semibold text-ink" numberOfLines={1}>
            {folder.title}
          </Text>
          <View className="w-10" />
        </View>

        <Text className="text-overline font-bold text-ink/40 px-space-card mb-3">
          경로
        </Text>

        {/* Map placeholder — 나중에 Google Map + 마커 */}
        <View
          className="mx-space-card rounded-card bg-surface-alt border border-ink/10 overflow-hidden"
          style={{ height: mapHeight }}
        >
          <View className="flex-1 items-center justify-center">
            <Ionicons name="map-outline" size={48} color="#9ca3af" />
            <Text className="text-body-sm text-ink/50 mt-2">
              지도
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View className="flex-1 mt-4 px-space-card">
          <Text className="text-overline font-bold text-ink/40 mb-4">
            타임라인
          </Text>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {MOCK_TIMELINE.map((item, index) => (
              <View key={item.id} className="flex-row mb-5">
                {/* Thumbnail — 디자인의 1/4 크기 (80x80) */}
                <View className="w-20 h-20 rounded-card-sm overflow-hidden bg-surface-alt border border-ink/5">
                  <Image
                    source={{ uri: item.imageUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="ml-3 flex-1 min-w-0 justify-center">
                  <Text className="text-caption font-bold text-ink/50">
                    {item.date}
                  </Text>
                  <Text
                    className="text-body font-semibold text-ink mt-0.5"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-caption text-ink/50 mt-0.5"
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}
