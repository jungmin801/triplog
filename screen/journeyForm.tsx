import { Button, Input } from "@/components";
import { CountrySelect } from "@/components/CountrySelect";
import { DateRangeInput } from "@/components/DateRangeInput";
import Header from "@/components/Header";
import useMember from "@/hooks/useMember";
import { pickImage } from "@/lib/imagePicker";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/provider/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePickerAsset } from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import "../global.css";

type FormValues = {
  journeyTitle: string;
  dateRange: { start: string; end: string };
  country: string | null;
};

const schema = z.object({
  journeyTitle: z.string().min(1, "Journey title is required"),
  dateRange: z.object({
    start: z.string().min(1, "Start date is required"),
    end: z.string().min(1, "End date is required"),
  }),
  country: z.string().min(1, "Country is required"),
});

export async function uploadImageToSupabase({
  bucket,
  uri,
  path,
  mimeType,
}: {
  bucket: string;
  uri: string;
  path: string;
  mimeType?: string | null;
}) {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read file: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Invalid image buffer (0 bytes).");
  }

  const contentType = mimeType ?? "image/jpeg";

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;
  return data.path;
}

export default function JourneyForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { member } = useMember();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      journeyTitle: "",
      dateRange: { start: "", end: "" },
      country: null,
    },
  });
  const [image, setImage] = useState<ImagePickerAsset | null>(null);

  const onSubmit = async (data: FormValues) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { data: journey, error: insertErr } = await supabase
      .from("journeys")
      .insert({
        owner_id: userId,
        title: data.journeyTitle,
        start_date: data.dateRange.start,
        end_date: data.dateRange.end,
        country_code: data.country,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.log("insertErr", insertErr);
      return;
    }

    if (!image) {
      router.push(`/journeys/${journey.id}`);
      return;
    }

    const imagePath = await uploadImageToSupabase({
      bucket: "media",
      uri: image.uri,
      path: `journeys/${journey.id}/thumbnail.jpg`,
      mimeType: image.mimeType,
    });

    if (imagePath) {
      const { error: updateErr } = await supabase
        .from("journeys")
        .update({ thumbnail_path: imagePath })
        .eq("id", journey.id);

      if (updateErr) {
        console.error("Error updating journey:", updateErr);
        return;
      }
    }

    router.push(`/journeys/${journey.id}`);
  };

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

            <View className="flex-col gap-5">
              {/* Trip Title */}
              <Controller
                control={control}
                name="journeyTitle"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="TRIP TITLE"
                    placeholder="e.g. 2026 Summer Vacation"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                control={control}
                name="dateRange"
                render={({ field: { onChange, value } }) => (
                  <DateRangeInput value={value} onChange={onChange} />
                )}
              />
              <Controller
                control={control}
                name="country"
                render={({ field: { onChange, value } }) => (
                  <CountrySelect value={value} onChange={onChange} />
                )}
              />
              {/* Photo: empty state vs preview + change/remove */}
              <View className="mb-8">
                <Text className="text-overline font-bold text-ink/40 mb-1.5">
                  PHOTO
                </Text>
                {!image ? (
                  <Pressable
                    className="rounded-card border-2 border-dashed bg-surface-alt items-center justify-center h-40 active:opacity-70"
                    style={{ borderColor: "rgba(26, 31, 43, 0.2)" }}
                    onPress={async () => {
                      const result = await pickImage();
                      if (result) setImage(result);
                    }}
                  >
                    <Ionicons name="image-outline" size={40} color="#9ca3af" />
                    <Text className="text-body-sm text-ink/50 mt-2">
                      Add photo
                    </Text>
                  </Pressable>
                ) : (
                  <View className="rounded-card overflow-hidden bg-surface-alt">
                    <View style={{ width: "100%", height: 200 }}>
                      <Image
                        source={{ uri: image.uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-row border-t border-ink/10">
                      <Pressable
                        className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-ink/5"
                        onPress={async () => {
                          const result = await pickImage();
                          if (result) setImage(result);
                        }}
                      >
                        <Ionicons
                          name="images-outline"
                          size={18}
                          color="#6B7280"
                        />
                        <Text className="text-body-sm font-medium text-ink/70">
                          Change photo
                        </Text>
                      </Pressable>
                      <View className="w-px bg-ink/10" />
                      <Pressable
                        className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-ink/5"
                        onPress={() => setImage(null)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#6B7280"
                        />
                        <Text className="text-body-sm font-medium text-ink/70">
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
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
                onPress={handleSubmit(onSubmit)}
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
