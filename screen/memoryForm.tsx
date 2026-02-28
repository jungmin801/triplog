import { Button, Input } from "@/components";
import Header from "@/components/Header";

import {
  LocationPickerModal,
  PickedPlace,
} from "@/components/LocationPickerModal";
import { PhotoPickerField } from "@/components/PhotoPickerField";
import { MOOD_OPTIONS } from "@/constants/mood";
import { journeyQueryKeys } from "@/lib/journeyQueries";
import parseGpsFromExif from "@/lib/parseGps";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { supabase } from "@/lib/supabase";
import { uploadImageToSupabase } from "@/lib/uploadImage";
import { useAuth } from "@/provider/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePickerAsset } from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import "../global.css";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const schema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요"),
  description: z.string().min(1, "이야기를 입력해 주세요"),
  mood: z.string().min(1, "오늘의 감정을 선택해 주세요"),
  memory_date: z.string().min(1, "날짜를 선택해 주세요"),
});

type FormValues = z.infer<typeof schema>;

export default function MemoryForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      mood: undefined,
      memory_date: todayString(),
    },
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [locationOverride, setLocationOverride] = useState<PickedPlace | null>(
    null,
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [gpsPlaceName, setGpsPlaceName] = useState<string | null>(null);

  // 이미지에 GPS가 있으면 역지오코딩으로 장소명 조회
  useEffect(() => {
    if (!image) {
      setGpsPlaceName(null);
      return;
    }
    const gps = parseGpsFromExif(image.exif);
    if (!gps?.lat || !gps?.lng) {
      setGpsPlaceName(null);
      return;
    }
    let cancelled = false;
    reverseGeocode(gps.lat, gps.lng).then((name) => {
      if (!cancelled) setGpsPlaceName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  const displayPlaceName = locationOverride?.place_name ?? gpsPlaceName ?? null;
  const queryClient = useQueryClient();

  const createMemoryMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const userId = session?.user?.id;
      if (!userId || !id || !image)
        throw new Error("Missing user, journey or image");

      const { count } = await supabase
        .from("memories")
        .select("*", { count: "exact", head: true })
        .eq("journey_id", id);

      if ((count ?? 0) >= 50) {
        throw new Error("memories_limit");
      }

      const gps = parseGpsFromExif(image.exif);
      const lat = locationOverride?.latitude ?? gps?.lat ?? null;
      const lng = locationOverride?.longitude ?? gps?.lng ?? null;
      const placeId = locationOverride?.place_id ?? null;

      const imagePath = await uploadImageToSupabase({
        bucket: "media",
        uri: image.uri,
        path: `journeys/${id}/memories/${Date.now()}-${Math.random().toString(36).slice(2, 11)}.jpg`,
        mimeType: image.mimeType,
      });

      await supabase.from("memories").insert({
        journey_id: id,
        created_by: userId,
        image_url: imagePath,
        description: data.title
          ? `${data.title}\n\n${data.description}`
          : data.description,
        latitude: lat,
        longitude: lng,
        place_id: placeId,
        mood: data.mood as "happy" | "excited" | "calm" | "sad" | "surprised",
        memory_date: data.memory_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: journeyQueryKeys.detail(id ?? ""),
      });
      router.back();
    },
    onError: (err) => {
      if ((err as Error).message === "memories_limit") {
        Alert.alert(
          "기억은 여정당 50개까지",
          "한 여정에는 최대 50개의 기억만 남길 수 있어요.",
        );
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!image) return;
    createMemoryMutation.mutate(data);
  };

  return (
    <View style={{ flex: 1 }} className="bg-surface">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{ kind: "title", title: "새 기억" }}
          showAvatar={false}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-space-card pb-32 pt-space-section">
            <Text className="text-h1 font-bold text-ink mb-1">새로운 기억</Text>
            <Text className="text-body text-ink/60 mb-4">
              그날의 순간을 기록해 보세요.
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="제목"
                  placeholder="예: 금각사 노을"
                  value={value}
                  onChangeText={onChange}
                  containerClassName="mb-5"
                  maxLength={100}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <>
                  <Text className="text-overline font-bold text-ink/40 mb-1.5">
                    이야기
                  </Text>
                  <TextInput
                    className="rounded-input border-2 border-ink/5 bg-background px-space-card py-space-card min-h-[100px] text-body text-ink placeholder:text-ink/30"
                    placeholder="무슨 일이 있었나요? 그날의 이야기를 들려주세요."
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}
            />

            <Controller
              control={control}
              name="mood"
              render={({ field: { onChange, value } }) => (
                <View className="mb-5">
                  <Text className="text-overline font-bold text-ink/40 mb-1.5">
                    오늘의 감정
                  </Text>
                  <View className="flex-row gap-2">
                    {MOOD_OPTIONS.map(({ key, emoji, label }) => {
                      const isSelected = value === key;
                      return (
                        <Pressable
                          key={label}
                          onPress={() => onChange(key)}
                          className={`flex-1 flex-col items-center justify-center rounded-btn border-2 py-3 active:opacity-80 min-h-[72px] ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-ink/10 bg-background"
                          }`}
                        >
                          <Text className="text-3xl mb-1">{emoji}</Text>
                          <Text
                            className={`text-caption font-semibold ${
                              isSelected ? "text-primary" : "text-ink/70"
                            }`}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="memory_date"
              render={({ field: { onChange, value } }) => (
                <View className="mb-5">
                  <Text className="text-overline font-bold text-ink/40 mb-1.5">
                    날짜
                  </Text>
                  <Pressable
                    onPress={() => setDatePickerOpen(true)}
                    className="flex-row items-center rounded-input border-2 border-ink/5 bg-background px-space-card h-12"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#8e8881"
                    />
                    <Text className="text-body text-ink ml-3">
                      {value
                        ? new Date(value).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "날짜 선택"}
                    </Text>
                  </Pressable>
                  <Modal
                    visible={datePickerOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDatePickerOpen(false)}
                  >
                    <Pressable
                      className="flex-1 bg-black/40 justify-end"
                      onPress={() => setDatePickerOpen(false)}
                    >
                      <Pressable
                        className="bg-background rounded-t-2xl p-4"
                        onPress={() => {}}
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-base font-semibold text-ink">
                            그날의 날짜
                          </Text>
                          <Pressable
                            onPress={() => setDatePickerOpen(false)}
                            hitSlop={10}
                          >
                            <Ionicons name="close" size={20} color="#6B7280" />
                          </Pressable>
                        </View>
                        <Calendar
                          current={value || todayString()}
                          markedDates={
                            value
                              ? {
                                  [value]: {
                                    selected: true,
                                    selectedColor: "#ee845d",
                                  },
                                }
                              : {}
                          }
                          onDayPress={(day) => {
                            onChange(day.dateString);
                            setDatePickerOpen(false);
                          }}
                        />
                      </Pressable>
                    </Pressable>
                  </Modal>
                </View>
              )}
            />

            {image && !parseGpsFromExif(image.exif) && (
              <View className="mb-6 rounded-card border-2 border-ink/10 bg-surface-alt p-4">
                <Text className="text-body text-ink/80 mb-1">
                  위치를 입력하면 지도에서 볼 수 있어요.
                </Text>
                <Pressable
                  className="mt-2 flex-row items-center justify-center gap-2 py-2.5 rounded-input bg-primary/10 active:opacity-80"
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Ionicons name="map-outline" size={18} color="#ee845d" />
                  <Text className="text-body font-semibold text-primary">
                    지도에서 선택하기
                  </Text>
                </Pressable>
              </View>
            )}

            <PhotoPickerField
              value={image}
              onChange={setImage}
              placeName={displayPlaceName}
            />

            <LocationPickerModal
              visible={showLocationPicker}
              onClose={() => setShowLocationPicker(false)}
              onSelect={(place: PickedPlace) => {
                setLocationOverride(place);
                setShowLocationPicker(false);
              }}
            />
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
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="md"
                className="w-full"
              >
                기억 남기기
              </Button>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
}
