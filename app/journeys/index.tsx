import Header from "@/components/Header";
import useCardSize from "@/hooks/useCardSize";
import useMember from "@/hooks/useMember";
import findCountry from "@/lib/findCountry";
import { fetchJourneys, journeyQueryKeys } from "@/lib/journeyQueries";
import { useQuery } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Navigation, NavTab, Tag, Text } from "../../components";
import "../../global.css";

export default function JourneysHome() {
  const router = useRouter();
  const { member } = useMember();
  const { data: journeys = [], isLoading } = useQuery({
    queryKey: journeyQueryKeys.list(),
    queryFn: fetchJourneys,
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
                {journeys.map((journey) => (
                  <Card.Root
                    key={journey.id}
                    variant="polaroid"
                    onPress={() =>
                      router.push(`/journeys/${journey.id}` as Href)
                    }
                    className="overflow-hidden w-full"
                    cardWidth={cardWidth.toString()}
                  >
                    <View className="relative">
                      <Card.Image
                        source={{
                          uri: journey.thumbnail ?? "",
                        }}
                      />
                      <View className="absolute top-3 right-3">
                        <Tag variant="primary">
                          {findCountry(journey.country_code)?.name ?? "미지정"}
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
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Navigation tabs={tabs} activeKey="journeys" onTabPress={onTabPress} />
      </SafeAreaView>
    </View>
  );
}
