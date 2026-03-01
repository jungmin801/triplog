import { pickImage } from "@/lib/imagePicker";
import { Ionicons } from "@expo/vector-icons";
import { ImagePickerAsset } from "expo-image-picker";
import { Image, Pressable, View } from "react-native";
import { Text } from "./Text";

export type PhotoPickerFieldProps = {
  label?: string;
  value: ImagePickerAsset | null;
  onChange: (asset: ImagePickerAsset | null) => void;
  containerClassName?: string;
  placeName?: string | null;
  /** 편집 시 기존 이미지 URI (value가 없을 때 표시) */
  existingImageUri?: string | null;
};

export function PhotoPickerField({
  label = "사진",
  value,
  onChange,
  containerClassName = "",
  placeName = null,
  existingImageUri = null,
}: PhotoPickerFieldProps) {
  const handlePick = async () => {
    const result = await pickImage();
    if (result) onChange(result);
  };

  const showPlaceholder = !value && !existingImageUri;
  const displayUri = value?.uri ?? existingImageUri ?? null;

  return (
    <View className={`mb-8 ${containerClassName}`}>
      <Text className="text-overline font-bold text-ink/40 mb-1.5">
        {label}
      </Text>
      {placeName ? (
        <View className="flex-row items-center gap-2 mb-1.5">
          <Ionicons name="location" size={14} color="#ee845d" />
          <Text
            className="text-body-sm text-ink/80 flex-1"
            numberOfLines={1}
          >
            {placeName}
          </Text>
        </View>
      ) : null}
      {showPlaceholder ? (
        <Pressable
          className="rounded-card border-2 border-dashed bg-surface-alt items-center justify-center h-40 active:opacity-70"
          style={{ borderColor: "rgba(26, 31, 43, 0.2)" }}
          onPress={handlePick}
        >
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
          <Text className="text-body-sm text-ink/50 mt-2">사진 추가</Text>
        </Pressable>
      ) : (
        <View className="rounded-card overflow-hidden bg-surface-alt">
          <View style={{ width: "100%", height: 200 }}>
            <Image
              source={{ uri: displayUri! }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </View>
          <View className="flex-row border-t border-ink/10">
            <Pressable
              className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-ink/5"
              onPress={handlePick}
            >
              <Ionicons
                name="images-outline"
                size={18}
                color="#6B7280"
              />
              <Text className="text-body-sm font-medium text-ink/70">
                사진 바꾸기
              </Text>
            </Pressable>
            <View className="w-px bg-ink/10" />
            <Pressable
              className="flex-1 py-3 flex-row items-center justify-center gap-2 active:bg-ink/5"
              onPress={() => onChange(null)}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#6B7280"
              />
              <Text className="text-body-sm font-medium text-ink/70">
                삭제
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
