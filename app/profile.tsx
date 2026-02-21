import { Avatar, Button, Navigation, NavTab } from "@/components";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const MENU_ITEMS = [
  {
    key: "journals",
    title: "My Journals",
    subtitle: "View and edit your stories",
    icon: "book-outline" as const,
    href: "/journeys" as Href,
  },
  {
    key: "buddies",
    title: "Travel Buddies",
    subtitle: "Manage your connections",
    icon: "people-outline" as const,
    href: "/profile" as Href,
  },
  {
    key: "places",
    title: "Saved Places",
    subtitle: "Wishlist for next trips",
    icon: "location-outline" as const,
    href: "/profile" as Href,
  },
  {
    key: "notifications",
    title: "Notifications",
    subtitle: "Stay updated on activities",
    icon: "notifications-outline" as const,
    showBadge: true,
    href: "/profile" as Href,
  },
];

export default function Profile() {
  const router = useRouter();

  const tabs: NavTab[] = [
    { key: "journeys", label: "Home", icon: "home-outline", href: "/journeys" },
    { key: "new", label: "Journeys", icon: "add-outline", href: "/journeys/new" },
    {
      key: "search",
      label: "Search",
      icon: "search-outline",
      href: "/(tabs)/search" as Href,
    },
    { key: "profile", label: "Profile", icon: "person-outline", href: "/profile" },
  ];

  const onTabPress = (href: Href) => router.push(href);

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Header
          center={{ kind: "title", title: "My Page" }}
          showAvatar={false}
          rightSlot={
            <View className="w-10 h-10 rounded-pill bg-background border border-ink/10 items-center justify-center">
              <Ionicons name="settings-outline" size={20} color="#1a1f2b" />
            </View>
          }
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-space-card">
            {/* Profile block */}
            <View className="flex-row items-start gap-4 mb-6">
              <View className="relative">
                <Avatar
                  size="xl"
                  fallback="AR"
                  className="border-2 border-primary"
                />
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-pill bg-primary border-2 border-background items-center justify-center">
                  <Ionicons name="pencil" size={14} color="#ffffff" />
                </View>
              </View>
              <View className="flex-1 pt-2">
                <Text className="text-h2 font-bold text-ink">Alex Rivera</Text>
                <Text className="text-body text-ink/60 mt-1">
                  alex.rivera@triplog.com
                </Text>
                <View className="flex-row gap-6 mt-4">
                  <View className="items-center">
                    <Text className="text-h3 font-bold text-ink">84</Text>
                    <Text className="text-overline font-bold text-ink/40 mt-0.5">
                      Journals
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-h3 font-bold text-ink">12</Text>
                    <Text className="text-overline font-bold text-ink/40 mt-0.5">
                      Buddies
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-h3 font-bold text-ink">428</Text>
                    <Text className="text-overline font-bold text-ink/40 mt-0.5">
                      Photos
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Menu list */}
            <View className="gap-2">
              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => router.push(item.href)}
                  className="flex-row items-center rounded-card bg-background border border-ink/5 p-4 active:opacity-80"
                >
                  <View className="w-10 h-10 rounded-btn-sm bg-primary/10 items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={20} color="#ee845d" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-h4 font-bold text-ink">
                      {item.title}
                    </Text>
                    <Text className="text-caption text-ink/50 mt-0.5">
                      {item.subtitle}
                    </Text>
                  </View>
                  {item.showBadge && (
                    <View className="w-2 h-2 rounded-pill bg-primary mr-2" />
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </Pressable>
              ))}
            </View>

            <Button
              variant="secondary"
              size="lg"
              onPress={() => router.replace("/login")}
              className="w-full mt-6"
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
