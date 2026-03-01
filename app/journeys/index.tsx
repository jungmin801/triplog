import Header from "@/components/Header";
import { JourneyMenuSheet } from "@/components/JourneyMenuSheet";
import useCardSize from "@/hooks/useCardSize";
import useMember from "@/hooks/useMember";
import findCountry from "@/lib/findCountry";
import {
  deleteJourney,
  fetchJourneys,
  journeyQueryKeys,
} from "@/lib/journeyQueries";
import { useAuth } from "@/provider/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Navigation, NavTab, Tag, Text } from "../../components";
import "../../global.css";

export default function JourneysHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { member } = useMember();
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? "";
  const [menuJourneyId, setMenuJourneyId] = useState<string | null>(null);

  const { data: journeys = [], isLoading } = useQuery({
    queryKey: journeyQueryKeys.list(),
    queryFn: fetchJourneys,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJourney,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.list() });
      setMenuJourneyId(null);
      router.replace("/journeys");
    },
  });

  const tabs: NavTab[] = [
    {
      key: "journeys",
      label: "홈",
      icon: "home-outline",
      href: "/journeys",
    },
    {
      key: "new",
      label: "여정",
      icon: "add-outline",
      href: "/journeys/new",
    },
    {
      key: "profile",
      label: "프로필",
      icon: "person-outline",
      href: "/profile",
    },
  ];

  const onTabPress = (href: Href) => {
    router.push(href);
  };

  const { cardWidth } = useCardSize();

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header />
        <ScrollView
          className="px-space-card h-100"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-h1 font-bold text-ink pt-space-item pb-space-section">
            Hello, {member?.full_name ?? "회원님"}
          </Text>
          <View className="pb-6 w-full">
            <Text className="text-h2 font-bold text-ink mb-4">함께한 여정</Text>

            {isLoading ? (
              <View className="py-12 items-center">
                <Text className="text-body text-ink/60">불러오는 중...</Text>
              </View>
            ) : (
              <View
                className="flex-column items-center self-center gap-6"
                style={{ width: cardWidth }}
              >
                {journeys.map((journey) => {
                  const isOwner =
                    currentUserId && journey.created_by === currentUserId;
                  return (
                    <Card.Root
                      key={journey.id}
                      variant="polaroid"
                      onPress={() =>
                        router.push(`/journeys/${journey.id}` as Href)
                      }
                      className="overflow-hidden w-full"
                      cardWidth={cardWidth.toString()}
                    >
                      {/* 이미지 위: 좌측 작성자(owner)명, 우측 메뉴(owner일 때만) */}
                      <View className="flex-row items-center justify-between px-3 py-2 bg-background">
                        <Text
                          className="text-caption text-ink/70 flex-1"
                          numberOfLines={1}
                        >
                          {""}
                        </Text>
                        {isOwner ? (
                          <Pressable
                            hitSlop={8}
                            onPress={(e) => {
                              e.stopPropagation();
                              setMenuJourneyId(journey.id);
                            }}
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
                      <View className="relative">
                        <Card.Image
                          source={{
                            uri: journey.thumbnail ?? "",
                          }}
                        />
                        <View className="absolute top-3 right-3">
                          <Tag variant="primary">
                            {findCountry(journey.country_code)?.name ??
                              "미지정"}
                          </Tag>
                        </View>
                      </View>
                      <Card.Content>
                        <Card.Title>{journey.title}</Card.Title>
                        <Text className="text-body-sm text-ink/60 mt-1">
                          {journey.start_date} - {journey.end_date}
                        </Text>
                        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-ink/5">
                          <Text className="text-overline text-ink/60">
                            {journey.member_count ?? 0}명
                          </Text>
                          <Text className="text-overline text-primary">
                            기억 {journey.memory_count ?? 0}개
                          </Text>
                        </View>
                      </Card.Content>
                    </Card.Root>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <Navigation tabs={tabs} activeKey="journeys" onTabPress={onTabPress} />

        <JourneyMenuSheet
          visible={!!menuJourneyId}
          onClose={() => setMenuJourneyId(null)}
          onEdit={() => {
            if (menuJourneyId)
              router.push(`/journeys/${menuJourneyId}/edit` as Href);
          }}
          onDelete={() => {
            if (!menuJourneyId) return;
            Alert.alert(
              "여정 삭제",
              "이 여정과 함께한 모든 기억과 멤버 정보가 삭제됩니다. 삭제하시겠어요?",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate(menuJourneyId),
                },
              ],
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
