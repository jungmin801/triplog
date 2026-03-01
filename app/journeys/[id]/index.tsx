import { Button, Card, Text } from "@/components";
import Header from "@/components/Header";
import { JourneyMenuSheet } from "@/components/JourneyMenuSheet";
import { MemoryMenuSheet } from "@/components/MemoryMenuSheet";
import useCardSize from "@/hooks/useCardSize";
import {
  deleteJourney,
  deleteMemory,
  fetchJourneyDetail,
  journeyQueryKeys,
} from "@/lib/journeyQueries";
import parseMood from "@/lib/parseMood";
import { shareInvite } from "@/lib/shareInvite";
import { useAuth } from "@/provider/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../../global.css";

export default function JourneyDetailsRoute() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? "";
  const { id } = useLocalSearchParams<{ id: string }>();
  const journeyId = id ?? "";
  const { cardWidth, cardGap, horizontalPadding, contentAreaWidth } =
    useCardSize();
  const { height: windowHeight } = useWindowDimensions();
  const cardMinHeight = Math.min(windowHeight * 0.65, 520);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryMenuId, setMemoryMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: journeyQueryKeys.detail(journeyId),
    queryFn: () => fetchJourneyDetail(journeyId),
    enabled: !!journeyId,
  });

  const deleteJourneyMutation = useMutation({
    mutationFn: deleteJourney,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.list() });
      setMenuOpen(false);
      router.replace("/journeys");
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: journeyQueryKeys.detail(journeyId),
      });
      setMemoryMenuId(null);
    },
  });

  const journey = data?.journey ?? null;
  const inviteCode = data?.inviteCode ?? null;
  const memories = data?.memories ?? [];
  const isOwner = !!(currentUserId && journey?.created_by === currentUserId);

  const snapInterval = cardWidth + cardGap;
  const entriesCount = memories.length;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    setActiveIndex(Math.min(Math.max(0, index), Math.max(0, entriesCount - 1)));
  };

  const headerTitle = journey?.title ?? "여정";
  const headerSubtitle = journey?.dateRange ?? "";

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header
          showBack
          onPressBack={() => router.push("/journeys")}
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
                  아직 남긴 기억이 없어요.{"\n"}첫 기억을 남겨 보세요.
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
                    const canEditMemory =
                      !!currentUserId && entry.created_by === currentUserId;
                    const canDeleteMemory =
                      !!currentUserId &&
                      (entry.created_by === currentUserId || isOwner);
                    const showMemoryMenu = canEditMemory || canDeleteMemory;
                    return (
                      <View
                        key={entry.id}
                        style={{
                          width: cardWidth,
                          minHeight: cardMinHeight,
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
                          {/* 헤더: 고정 높이 */}
                          <View className="flex-shrink-0 flex-row items-center justify-between px-3 py-2 border-b border-ink/5 bg-background">
                            <Text
                              className="text-caption text-ink/70 flex-1"
                              numberOfLines={1}
                            >
                              {entry.author_name || "알 수 없음"}
                            </Text>
                            {showMemoryMenu ? (
                              <Pressable
                                hitSlop={8}
                                onPress={() => setMemoryMenuId(entry.id)}
                                className="p-1"
                              >
                                <Ionicons
                                  name="ellipsis-horizontal"
                                  size={20}
                                  color="#6B7280"
                                />
                              </Pressable>
                            ) : null}
                          </View>
                          {/* 이미지: 고정 비율 */}
                          <View className="flex-shrink-0 relative">
                            <Card.Image source={{ uri: entry.imageUri }} />
                            {entry.mood ? (
                              <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-end">
                                <View className="rounded-pill bg-background/90 px-1.5 py-1">
                                  <Text className="text-lg font-bold text-ink">
                                    {parseMood(entry.mood)?.emoji}
                                  </Text>
                                </View>
                              </View>
                            ) : null}
                          </View>
                          {/* Content: 헤더·이미지 제외한 나머지 영역 전부 */}
                          <Card.Content className="flex-1 min-h-0 flex-col justify-between py-2">
                            <View className="flex-shrink-0">
                              <View className="flex-row items-center gap-1 mb-2">
                                <Ionicons
                                  name="location-outline"
                                  size={16}
                                  color="#ee845d"
                                />
                                <Card.Title className="text-primary text-h4 font-bold flex-1">
                                  {entry.title}
                                </Card.Title>
                              </View>
                              <Text
                                className="text-body text-ink/80"
                                numberOfLines={10}
                              >
                                {entry.subtitle}
                              </Text>
                            </View>
                            <Text className="text-body-sm text-ink/60 flex-shrink-0">
                              {entry.date}
                            </Text>
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
            <View className="px-space-card pb-24 flex-row justify-between">
              <Button
                variant="primary"
                size="sm"
                onPress={() =>
                  router.push(`/journeys/${journeyId}/memories/new`)
                }
              >
                <Ionicons name="camera-outline" size={18} color="white" />
                <Text className="text-btn-sm font-bold text-white">
                  기억 남기기
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

        <JourneyMenuSheet
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onEdit={() => router.push(`/journeys/${journeyId}/edit` as any)}
          onDelete={() => {
            Alert.alert(
              "여정 삭제",
              "이 여정과 함께한 모든 기억과 멤버 정보가 삭제됩니다. 삭제하시겠어요?",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: () => deleteJourneyMutation.mutate(journeyId),
                },
              ],
            );
          }}
        />

        {memoryMenuId && (
          <MemoryMenuSheet
            visible={!!memoryMenuId}
            onClose={() => setMemoryMenuId(null)}
            canEdit={
              !!currentUserId &&
              memories.find((m) => m.id === memoryMenuId)?.created_by ===
                currentUserId
            }
            canDelete={
              !!currentUserId &&
              (memories.find((m) => m.id === memoryMenuId)?.created_by ===
                currentUserId ||
                isOwner)
            }
            onEdit={() => {
              if (memoryMenuId)
                router.push(
                  `/journeys/${journeyId}/memories/${memoryMenuId}/edit` as any,
                );
            }}
            onDelete={() => {
              if (!memoryMenuId) return;
              Alert.alert("기억 삭제", "이 기억을 삭제하시겠어요?", [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: () => deleteMemoryMutation.mutate(memoryMenuId),
                },
              ]);
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
