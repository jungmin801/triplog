import { Avatar, Button, Navigation, NavTab } from "@/components";
import Header from "@/components/Header";
import useMember from "@/hooks/useMember";
import findCountry from "@/lib/findCountry";
import {
  fetchMyJourneys,
  fetchProfileStats,
  profileQueryKeys,
} from "@/lib/profileQueries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/provider/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} - ${e.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function Profile() {
  const router = useRouter();
  const { session } = useAuth();
  const { member } = useMember();
  const userId = session?.user?.id ?? "";

  const { data: stats } = useQuery({
    queryKey: profileQueryKeys.stats(userId),
    queryFn: () => fetchProfileStats(userId),
    enabled: !!userId,
  });

  const { data: myJourneys = [] } = useQuery({
    queryKey: profileQueryKeys.myJourneys(userId),
    queryFn: () => fetchMyJourneys(userId),
    enabled: !!userId,
  });

  const tabs: NavTab[] = [
    { key: "journeys", label: "Home", icon: "home-outline", href: "/journeys" },
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

  const onTabPress = (href: Href) => router.push(href);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const displayName = member?.full_name ?? "회원";
  const fallbackInitials = displayName.slice(0, 2).toUpperCase() || "?";
  const email = session?.user?.email ?? "";

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header
          center={{ kind: "title", title: "My Page" }}
          showAvatar={false}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-space-card">
            {/* Profile block - 읽기 전용 */}
            <View className="flex-row items-start gap-4 mb-6">
              <Avatar
                size="xl"
                fallback={fallbackInitials}
                className="border-2 border-primary"
              />
              <View className="flex-1 pt-2">
                <Text className="text-h2 font-bold text-ink">
                  {displayName}
                </Text>
                <Text className="text-body text-ink/60 mt-1" numberOfLines={1}>
                  {email || "—"}
                </Text>
                <View className="flex-row gap-6 mt-4">
                  <View className="items-center">
                    <Text className="text-h3 font-bold text-ink">
                      {stats?.journeyCount ?? 0}
                    </Text>
                    <Text className="text-overline font-bold text-ink/40 mt-0.5">
                      참여한 여정
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-h3 font-bold text-ink">
                      {stats?.memoryCount ?? 0}
                    </Text>
                    <Text className="text-overline font-bold text-ink/40 mt-0.5">
                      포스트한 메모리
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* My Journey - 리스트 카드 (썸네일 + 타이틀 + 기간 + country 뱃지) */}
            <Text className="text-overline font-bold text-ink/40 mb-2">
              MY JOURNEY
            </Text>
            <View className="gap-2 mb-6">
              {myJourneys.length === 0 ? (
                <View className="rounded-card bg-background border border-ink/5 p-4">
                  <Text className="text-body text-ink/50 text-center">
                    참여한 여정이 없어요.
                  </Text>
                </View>
              ) : (
                myJourneys.map((journey) => (
                  <Pressable
                    key={journey.id}
                    onPress={() =>
                      router.push(`/journeys/${journey.id}` as Href)
                    }
                    className="flex-row items-center rounded-card bg-background border border-ink/5 p-4 active:opacity-80"
                  >
                    <View className="w-14 h-14 rounded-btn-sm overflow-hidden bg-ink/10 mr-3">
                      {journey.thumbnail ? (
                        <Image
                          source={{ uri: journey.thumbnail }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Ionicons
                            name="image-outline"
                            size={24}
                            color="#9ca3af"
                          />
                        </View>
                      )}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text
                        className="text-h4 font-bold text-ink"
                        numberOfLines={1}
                      >
                        {journey.title || "Untitled"}
                      </Text>
                      <Text
                        className="text-caption text-ink/50 mt-0.5"
                        numberOfLines={1}
                      >
                        {formatDateRange(
                          journey.start_date,
                          journey.end_date,
                        ) || "—"}
                      </Text>
                      {journey.country_code ? (
                        <View className="mt-1.5 self-start">
                          <View className="rounded-pill bg-primary/10 px-2 py-0.5">
                            <Text className="text-small font-semibold text-primary">
                              {findCountry(journey.country_code)?.name ??
                                journey.country_code}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#94a3b8"
                    />
                  </Pressable>
                ))
              )}
            </View>

            {/* 로그아웃 - 하단 배치 */}
            <Button
              variant="secondary"
              size="lg"
              onPress={onLogout}
              className="w-full"
            >
              Logout
            </Button>
          </View>
        </ScrollView>

        <Navigation tabs={tabs} activeKey="profile" onTabPress={onTabPress} />
      </SafeAreaView>
    </View>
  );
}
