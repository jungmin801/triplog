import Header from "@/components/Header";
import useCardSize from "@/hooks/useCardSize";
import { supabase } from "@/lib/supabase";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, Navigation, NavTab, Tag } from "../../components";
import "../../global.css";

export default function JourneysHome() {
  const router = useRouter();
  const [journeys, setJourneys] = useState<[]>([]);

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
    setJourneys(data);
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
            Hello, Kathryn
          </Text>
          <View className="pb-6 w-full flex-1 min-h-dvh">
            <Text className="text-h2 font-bold text-ink mb-4">
              Your Journeys
            </Text>

            <View
              className="flex-column items-center self-center"
              style={{ width: cardWidth }}
            >
              <Card.Root
                variant="polaroid"
                onPress={() => router.push("/journeys/123" as Href)}
                className="overflow-hidden w-full"
                cardWidth={cardWidth.toString()}
              >
                <View className="relative">
                  <Card.Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800",
                    }}
                  />
                  <View className="absolute top-3 right-3">
                    <Tag variant="primary">Italy</Tag>
                  </View>
                </View>
                <Card.Content>
                  <Card.Title>Venice Getaway</Card.Title>
                  <Text className="text-body-sm text-ink/60 mt-1">
                    Aug 12 - Aug 18, 2023
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
            </View>
          </View>
        </ScrollView>

        <Navigation tabs={tabs} activeKey="journeys" onTabPress={onTabPress} />
      </SafeAreaView>
    </View>
  );
}
