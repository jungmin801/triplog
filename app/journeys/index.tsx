import Header from "@/components/Header";
import useCardSize from "@/hooks/useCardSize";
import useMember from "@/hooks/useMember";
import findCountry from "@/lib/findCountry";
import { supabase } from "@/lib/supabase";
import { Journey } from "@/types";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, Navigation, NavTab, Tag } from "../../components";
import "../../global.css";

export default function JourneysHome() {
  const router = useRouter();
  const { member } = useMember();
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const tabs: NavTab[] = [
    {
      key: "journeys",
      label: "Home",
      icon: "home-outline",
      href: "/journeys",
    },
    {
      key: "new",
      label: "Journeys",
      icon: "add-outline",
      href: "/journeys/new",
    },
    {
      key: "search",
      label: "Search",
      icon: "search-outline",
      href: "/(tabs)/search" as Href,
    },
    {
      key: "profile",
      label: "Profile",
      icon: "person-outline",
      href: "/profile",
    },
  ];

  const onTabPress = (href: Href) => {
    router.push(href);
  };

  const { cardWidth } = useCardSize();

  const fetchJourneys = async () => {
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching journeys:", error);
      return;
    }

    const journeys = data ?? [];

    // 1) 썸네일 path만 모으기 (null/undefined 제외)
    const paths = journeys
      .map((j) => j.thumbnail_path)
      .filter((p): p is string => typeof p === "string" && p.length > 0);

    // 2) 썸네일이 하나도 없으면 그대로 set
    if (paths.length === 0) {
      setJourneys(journeys);
      return;
    }

    // 3) 한 번에 signed url 발급
    const { data: signedList, error: signedErr } = await supabase.storage
      .from("media")
      .createSignedUrls(paths, 60 * 60); // 1시간

    if (signedErr) {
      console.error("Error creating signed urls:", signedErr);
      setJourneys(journeys); // 썸네일만 포기하고 리스트는 보여주기
      return;
    }

    // 4) path -> signedUrl 매핑
    const urlByPath = new Map(
      (signedList ?? []).map((x) => [x.path, x.signedUrl] as const),
    );

    // 5) journey에 thumbnail 키로 signed url 붙이기
    const enriched = journeys.map((j) => ({
      ...j,
      thumbnail: j.thumbnail_path
        ? (urlByPath.get(j.thumbnail_path) ?? null)
        : null,
    }));

    setJourneys(enriched);
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header />
        <ScrollView
          className="px-space-card h-100"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-h1 font-bold text-ink pt-space-item pb-space-section">
            Hello, {member?.display_name ?? "회원님"}
          </Text>
          <View className="pb-6 w-full flex-1 min-h-dvh">
            <Text className="text-h2 font-bold text-ink mb-4">
              Your Journeys
            </Text>

            <View
              className="flex-column items-center self-center"
              style={{ width: cardWidth }}
            >
              {journeys.map((journey) => (
                <Card.Root
                  key={journey.id}
                  variant="polaroid"
                  onPress={() => router.push(`/journeys/${journey.id}` as Href)}
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
                        {findCountry(journey.country_code)?.name ?? "Unknown"}
                      </Tag>
                    </View>
                  </View>
                  <Card.Content>
                    <Card.Title>{journey.title}</Card.Title>
                    <Text className="text-body-sm text-ink/60 mt-1">
                      {journey.start_date} - {journey.end_date}
                    </Text>
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-ink/5">
                      <View className="flex-row items-center -space-x-2">
                        <View className="border-2 border-background rounded-pill overflow-hidden">
                          <Avatar size="sm" fallback="A" />
                        </View>
                        <View className="border-2 border-background rounded-pill overflow-hidden">
                          <Avatar size="sm" fallback="B" />
                        </View>
                        <View className="w-7 h-7 rounded-pill bg-ink/10 border-2 border-background items-center justify-center">
                          <Text className="text-small font-bold text-ink/60">
                            +2
                          </Text>
                        </View>
                      </View>
                      <Text className="text-overline text-primary">
                        48 Photos
                      </Text>
                    </View>
                  </Card.Content>
                </Card.Root>
              ))}
            </View>
          </View>
        </ScrollView>

        <Navigation tabs={tabs} activeKey="journeys" onTabPress={onTabPress} />
      </SafeAreaView>
    </View>
  );
}
