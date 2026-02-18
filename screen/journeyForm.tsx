import { Avatar, Button, Input } from "@/components";
import { CountrySelect } from "@/components/CountrySelect";
import { DateRangeInput } from "@/components/DateRangeInput";
import Header from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const MOCK_COMPANIONS = [
  { id: "1", name: "Sarah", online: true },
  { id: "2", name: "Jessica", invited: true },
  { id: "3", name: "David", online: false },
];

export default function JourneyForm() {
  const router = useRouter();
  const [tripTitle, setTripTitle] = useState("");
  const [range, setRange] = useState<{ start?: string; end?: string }>({});
  const [country, setCountry] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }} className="bg-surface">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{ kind: "title", title: "New Journey" }}
          showAvatar={false}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-space-card pb-32 pt-space-section">
            <Text className="text-h1 font-bold text-ink mb-1">
              Plan your trip
            </Text>
            <Text className="text-body text-ink/60 mb-4">
              새로운 여정을 시작하세요.
            </Text>

            {/* Trip Title */}
            <Input
              label="TRIP TITLE"
              placeholder="e.g. 2026 Summer Vacation"
              value={tripTitle}
              onChangeText={setTripTitle}
              containerClassName="mb-5"
            />

            {/* Date Range */}
            <DateRangeInput value={range} onChange={setRange} />

            {/* Trip Location */}
            <CountrySelect
              label="TRIP LOCATION"
              value={country}
              onChange={setCountry}
              placeholder="Select country"
              containerClassName="mb-5"
            />

            {/* Companions */}
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-overline font-bold text-ink/40">
                  COMPANIONS
                </Text>
                <Pressable className="active:opacity-70">
                  <Text className="text-body-sm font-semibold text-primary">
                    View Friends
                  </Text>
                </Pressable>
              </View>
              <View className="flex-row items-start gap-4">
                {MOCK_COMPANIONS.map((c) => (
                  <View key={c.id} className="items-center w-14">
                    <View className="relative">
                      <Avatar size="lg" fallback={c.name} />
                      {c.online && (
                        <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-pill bg-green-400 border-2 border-background" />
                      )}
                      {c.invited && (
                        <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-pill bg-primary border-2 border-background items-center justify-center">
                          <Ionicons
                            name="checkmark"
                            size={10}
                            color="#ffffff"
                          />
                        </View>
                      )}
                    </View>
                    <Text
                      className="text-caption font-medium text-ink mt-2"
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </View>
                ))}
                
                <Pressable className="items-center w-14 active:opacity-70">
                  <View className="w-14 h-14 rounded-btn bg-background border-2 border-ink/10 items-center justify-center">
                    <Ionicons name="add" size={24} color="#4a443f" />
                  </View>
                  <Text className="text-caption font-medium text-ink mt-2">
                    Add
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View
          style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
          className="bg-surface pt-4 px-space-card"
        >
          <SafeAreaView edges={["bottom"]}>
            <View className="flex-row justify-center px-space-card pb-space-section">
            <Button
              onPress={() => router.back()}
              variant="primary"
              size="md"
              className="w-full"
            >
              Create Journey
            </Button>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
}
