import { Button, Card } from "@/components";
import Header from "@/components/Header";
import useCardSize from "@/hooks/useCardSize";
import { shareInvite } from "@/lib/shareInvite";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

const MOCK_ENTRIES = [
  {
    id: "1",
    title: "Kyoto Temple Trail",
    subtitle: "Japan • 4 Days Guide",
    imageUri:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
    tag: "JAPAN",
    date: "Aug 12 - Aug 18, 2023",
  },
  {
    id: "2",
    title: "Golden Pavilion",
    subtitle: "Kinkaku-ji morning light",
    imageUri:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
    tag: "TEMPLE",
    date: "Oct 1 - Oct 7, 2023",
  },
  {
    id: "3",
    title: "Arashiyama Bamboo",
    subtitle: "Walking the bamboo grove",
    imageUri: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800",
    tag: "NATURE",
    date: "Nov 1 - Nov 7, 2023",
  },
];

const MOCK_FOLDERS: Record<string, { title: string; dateRange: string }> = {
  default: { title: "Venice Getaway", dateRange: "Aug 12 - Aug 18, 2023" },
  "1": { title: "Venice Getaway", dateRange: "Aug 12 - Aug 18, 2023" },
  "2": { title: "Kyoto Serenity", dateRange: "Oct 1 - Oct 7, 2023" },
};

export default function JourneyDetailsRoute() {
  const router = useRouter();
  const { id = "default" } = useLocalSearchParams<{ id: string }>();
  console.log("id", id);
  const { cardWidth, cardGap, horizontalPadding } = useCardSize();
  const scrollRef = useRef<ScrollView>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const folder = MOCK_FOLDERS[id] ?? MOCK_FOLDERS.default;

  const snapInterval = cardWidth + cardGap;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    setActiveIndex(Math.min(Math.max(0, index), MOCK_ENTRIES.length - 1));
  };

  const findInviteCode = async () => {
    const { data, error } = await supabase
      .from("journeys")
      .select("invite_code")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error finding invite code:", error);
      return;
    }

    console.log("data", data);

    setInviteCode(data?.invite_code ?? null);
  };

  useEffect(() => {
    findInviteCode();
  }, []);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{
            kind: "title",
            title: folder.title,
            subtitle: folder.dateRange,
          }}
          showAvatar={false}
        />

        {/* Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingBottom: 24,
            paddingTop: 16,
          }}
          onMomentumScrollEnd={onScroll}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {MOCK_ENTRIES.map((entry, index) => (
            <View
              key={entry.id}
              style={{
                width: cardWidth,
                marginRight: index < MOCK_ENTRIES.length - 1 ? cardGap : 0,
              }}
            >
              <Card.Root
                variant="polaroid"
                onPress={() => {}}
                className="overflow-hidden flex-1"
                cardWidth={cardWidth.toString()}
              >
                <View className="relative">
                  <Card.Image source={{ uri: entry.imageUri }} />
                  <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-end">
                    <View className="rounded-pill bg-background/90 px-2.5 py-1.5">
                      <Text className="text-overline font-bold text-ink">
                        ★ 4.9
                      </Text>
                    </View>
                  </View>
                </View>
                <Card.Content>
                  <View className="flex-row items-center gap-1 mb-2">
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#ee845d"
                    />
                    <Card.Title className="text-primary text-h4 font-bold">
                      {entry.title}
                    </Card.Title>
                  </View>
                  <View className="flex-1 flex-col justify-between">
                    <Text className="text-body-md">{entry.subtitle}</Text>
                    <Text className="text-body-sm text-ink/60 mt-1">
                      {entry.date}
                    </Text>
                  </View>
                </Card.Content>
              </Card.Root>
            </View>
          ))}
        </ScrollView>

        {/* Carousel pagination dots */}
        <View className="flex-row justify-center items-center gap-2 py-2">
          {MOCK_ENTRIES.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 rounded-pill ${index === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-ink/20"}`}
            />
          ))}
        </View>

        {/* Add Memory button */}
        <View className="px-space-card pb-8 flex-row justify-between">
          <Button
            variant="soft"
            size="sm"
            onPress={() => router.push(`/journeys/${id}/memories/new`)}
          >
            <Ionicons name="camera-outline" size={18} color="#ee845d" />
            <Text className="text-btn-sm font-bold text-primary">
              Add Memory
            </Text>
          </Button>
          <View className="flex-row items-center gap-2">
            <Button
              variant="soft"
              size="sm"
              className="rounded-pill"
              onPress={() => shareInvite(inviteCode ?? "")}
            >
              <Ionicons name="share-outline" size={18} color="#ee845d" />
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-pill"
              onPress={() => {}}
            >
              <Ionicons name="map-outline" size={18} color="#f8f8f8" />
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
