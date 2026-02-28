import { Button, Card } from "@/components";
import Header from "@/components/Header";
import useCardSize from "@/hooks/useCardSize";
import { fetchJourneyDetail, journeyQueryKeys } from "@/lib/journeyQueries";
import parseMood from "@/lib/parseMood";
import { shareInvite } from "@/lib/shareInvite";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

export default function JourneyDetailsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const journeyId = id ?? "";
  const { cardWidth, cardGap, horizontalPadding, contentAreaWidth } =
    useCardSize();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: journeyQueryKeys.detail(journeyId),
    queryFn: () => fetchJourneyDetail(journeyId),
    enabled: !!journeyId,
  });

  const journey = data?.journey ?? null;
  const inviteCode = data?.inviteCode ?? null;
  const memories = data?.memories ?? [];

  const snapInterval = cardWidth + cardGap;
  const entriesCount = memories.length;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    setActiveIndex(Math.min(Math.max(0, index), Math.max(0, entriesCount - 1)));
  };

  const headerTitle = journey?.title ?? "Journey";
  const headerSubtitle = journey?.dateRange ?? "";

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{
            kind: "title",
            title: headerTitle,
            subtitle: headerSubtitle,
          }}
          showAvatar={false}
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-16">
            <Text className="text-body text-ink/60">불러오는 중...</Text>
          </View>
        ) : (
          <>
            {memories.length === 0 ? (
              <View className="flex-1 items-center justify-center py-16 px-6">
                <Text className="text-body text-ink/60 text-center">
                  아직 메모리가 없어요.{"\n"}첫 메모리를 추가해 보세요.
                </Text>
              </View>
            ) : (
              <>
                {/* Carousel */}
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled={false}
                  snapToInterval={snapInterval}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft:
                      horizontalPadding +
                      Math.max(0, (contentAreaWidth - cardWidth) / 2),
                    paddingRight:
                      horizontalPadding +
                      Math.max(0, (contentAreaWidth - cardWidth) / 2),
                    paddingBottom: 24,
                    paddingTop: 16,
                  }}
                  onMomentumScrollEnd={onScroll}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                >
                  {memories.map((entry, index) => {
                    return (
                      <View
                        key={entry.id}
                        style={{
                          width: cardWidth,
                          marginRight:
                            index < memories.length - 1 ? cardGap : 0,
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
                            {entry.mood ? (
                              <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-end">
                                <View className="rounded-pill bg-background/90 px-1.5 py-1.5">
                                  <Text className="text-lg font-bold text-ink">
                                    {parseMood(entry.mood)?.emoji}
                                  </Text>
                                </View>
                              </View>
                            ) : null}
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
                              <Text className="text-body-md">
                                {entry.subtitle}
                              </Text>
                              <Text className="text-body-sm text-ink/60 mt-1">
                                {entry.date}
                              </Text>
                            </View>
                          </Card.Content>
                        </Card.Root>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Carousel counter: 1 / 50 */}
                {memories.length > 0 && (
                  <View className="flex-row justify-center items-center py-2">
                    <Text className="text-body-sm text-ink/70">
                      {activeIndex + 1} / {memories.length}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Add Memory button */}
            <View className="px-space-card pb-8 flex-row justify-between">
              <Button
                variant="soft"
                size="sm"
                onPress={() =>
                  router.push(`/journeys/${journeyId}/memories/new`)
                }
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
                {/* TODO: map view */}
                {/* <Button
                  variant="primary"
                  size="sm"
                  className="rounded-pill"
                  onPress={() => {}}
                >
                  <Ionicons name="map-outline" size={18} color="#f8f8f8" />
                </Button> */}
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}
