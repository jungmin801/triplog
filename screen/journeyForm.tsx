import { Button, Input } from "@/components";
import { CountrySelect } from "@/components/CountrySelect";
import { DateRangeInput } from "@/components/DateRangeInput";
import Header from "@/components/Header";
import { PhotoPickerField } from "@/components/PhotoPickerField";
import {
  fetchJourneyForEdit,
  journeyQueryKeys,
  updateJourney,
} from "@/lib/journeyQueries";
import { supabase } from "@/lib/supabase";
import { uploadImageToSupabase } from "@/lib/uploadImage";
import { useAuth } from "@/provider/authProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePickerAsset } from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Text } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import "../global.css";

type FormValues = {
  journeyTitle: string;
  dateRange: { start: string; end: string };
  country: string | null;
};

const schema = z.object({
  journeyTitle: z.string().min(1, "여정 이름을 입력해 주세요"),
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
  const { id: journeyId } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!journeyId;

  const { data: journeyForEdit, isLoading: isLoadingEdit } = useQuery({
    queryKey: [...journeyQueryKeys.detail(journeyId ?? ""), "edit"],
    queryFn: () => fetchJourneyForEdit(journeyId ?? ""),
    enabled: isEdit && !!journeyId,
  });

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      journeyTitle: "",
      dateRange: { start: "", end: "" },
      country: null,
    },
  });
  const [image, setImage] = useState<ImagePickerAsset | null>(null);

  useEffect(() => {
    if (!journeyForEdit) return;
    reset({
      journeyTitle: journeyForEdit.title,
      dateRange: {
        start: journeyForEdit.start_date,
        end: journeyForEdit.end_date,
      },
      country: journeyForEdit.country_code,
    });
  }, [journeyForEdit, reset]);

  const createMutation = useMutation({
    mutationFn: ({ data, image }: { data: FormValues; image: ImagePickerAsset | null }) =>
      createJourneyWithThumbnail(data, image),
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.detail(newId) });
      router.push(`/journeys/${newId}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      data,
      image,
    }: {
      data: FormValues;
      image: ImagePickerAsset | null;
      journeyId: string;
    }) => {
      let thumbnailUrl: string | undefined;
      if (image) {
        const path = await uploadImageToSupabase({
          bucket: "media",
          uri: image.uri,
          path: `journeys/${journeyId}/thumbnail.jpg`,
          mimeType: image.mimeType,
        });
        thumbnailUrl = path ?? undefined;
      }
      await updateJourney(journeyId, {
        title: data.journeyTitle,
        start_date: data.dateRange.start,
        end_date: data.dateRange.end,
        country_code: data.country ?? "",
        ...(thumbnailUrl !== undefined && { thumbnail_url: thumbnailUrl }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: journeyQueryKeys.detail(journeyId!) });
      router.replace(`/journeys/${journeyId}`);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEdit && journeyId) {
      updateMutation.mutate({ data, image, journeyId });
    } else {
      createMutation.mutate({ data, image });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingEdit) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#ee845d" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-surface">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <Header
          showBack
          onPressBack={() => router.back()}
          center={{
            kind: "title",
            title: isEdit ? "여정 수정" : "새 여정",
          }}
          showAvatar={false}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-space-card pb-32 pt-space-section">
            <Text className="text-h1 font-bold text-ink mb-1">
              {isEdit ? "여정 수정" : "여정을 시작해 보세요"}
            </Text>
            <Text className="text-body text-ink/60 mb-4">
              {isEdit
                ? "이름, 기간, 나라를 수정할 수 있어요."
                : "함께할 여정의 이름과 기간을 정해 주세요."}
            </Text>

            <View className="flex-col gap-5">
              {/* Trip Title */}
              <Controller
                control={control}
                name="journeyTitle"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="여정 이름"
                    placeholder="예: 2026 여름 방학"
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
                disabled={isSubmitting}
              >
                {isEdit ? "수정 완료" : "여정 만들기"}
              </Button>
            </View>
          </SafeAreaView>
        </View>
      </SafeAreaView>
    </View>
  );
}
