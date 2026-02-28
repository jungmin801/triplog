import { Button, Input } from "@/components";
import { CountrySelect } from "@/components/CountrySelect";
import { DateRangeInput } from "@/components/DateRangeInput";
import Header from "@/components/Header";
import { PhotoPickerField } from "@/components/PhotoPickerField";
import useMember from "@/hooks/useMember";
import { journeyQueryKeys } from "@/lib/journeyQueries";
import { supabase } from "@/lib/supabase";
import { uploadImageToSupabase } from "@/lib/uploadImage";
import { useAuth } from "@/provider/authProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePickerAsset } from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
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

async function createJourneyWithThumbnail(
  data: FormValues,
  image: ImagePickerAsset | null,
): Promise<string> {
  const { data: journeyId, error: insertErr } = await supabase.rpc(
    "create_journey",
    {
      p_title: data.journeyTitle,
      p_start_date: data.dateRange.start,
      p_end_date: data.dateRange.end,
      p_country_code: data.country,
    },
  );

  if (insertErr) throw insertErr;
  if (!journeyId) throw new Error("No journey id returned");

  if (!image) return journeyId;

  const imagePath = await uploadImageToSupabase({
    bucket: "media",
    uri: image.uri,
    path: `journeys/${journeyId}/thumbnail.jpg`,
    mimeType: image.mimeType,
  });

  if (imagePath) {
    const { error: updateErr } = await supabase
      .from("journeys")
      .update({ thumbnail_url: imagePath })
      .eq("id", journeyId);
    if (updateErr) console.error("Error updating journey:", updateErr);
  }

  return journeyId;
}

export default function JourneyForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const createMutation = useMutation({
    mutationFn: ({ data, image }: { data: FormValues; image: ImagePickerAsset | null }) =>
      createJourneyWithThumbnail(data, image),
    onSuccess: (journeyId) => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.detail(journeyId) });
      router.push(`/journeys/${journeyId}`);
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({ data, image });
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
              <PhotoPickerField value={image} onChange={setImage} />
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
