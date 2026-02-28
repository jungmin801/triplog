import { COUNTRIES } from "@/constants/countries";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

/** value/onChange는 국가 코드(code) 기준. 백엔드에는 code 전달. */
export type CountrySelectProps = {
  label?: string;
  value: string | null;
  onChange: (countryCode: string | null) => void;
  placeholder?: string;
  containerClassName?: string;
};

export function CountrySelect({
  label = "나라",
  value,
  onChange,
  placeholder = "나라 선택",
  containerClassName = "",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const displayValue = useMemo(() => {
    if (!value) return null;
    return COUNTRIES.find((c) => c.code === value)?.name ?? value;
  }, [value]);

  const onSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  const onClear = () => {
    onChange(null);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Pressable className={containerClassName} onPress={() => setOpen(true)}>
        {label ? (
          <Text className="text-overline font-bold text-ink/40 mb-1.5">
            {label}
          </Text>
        ) : null}
        <View className="flex-row items-center rounded-input border-2 border-ink/5 bg-background px-space-card h-12">
          <Ionicons name="location-outline" size={18} color="#8e8881" />
          <Text
            className={`text-body ml-3 flex-1 ${value ? "text-ink" : "text-ink/60"}`}
            numberOfLines={1}
          >
            {displayValue ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#8e8881" />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-background rounded-t-2xl max-h-[80%]"
            onPress={() => {}}
          >
            <View className="p-4 border-b border-ink/5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold text-ink">
                  나라 선택
                </Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>
              <TextInput
                className="rounded-input border-2 border-ink/10 bg-surface-alt px-3 h-11 text-body text-ink placeholder:text-ink/40"
                placeholder="나라 검색..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              className="max-h-80"
              ListEmptyComponent={
                <Text className="text-body text-ink/50 p-4 text-center">
                  검색 결과 없음
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  className="px-4 py-3.5 border-b border-ink/5 active:bg-ink/5 flex-row items-center justify-between"
                  onPress={() => onSelect(item.code)}
                >
                  <Text className="text-body text-ink" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {value === item.code ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#ee845d"
                    />
                  ) : null}
                </Pressable>
              )}
            />
            <View className="flex-row gap-2 p-4 border-t border-ink/5">
              <Pressable
                className="flex-1 h-11 rounded-input border border-ink/10 items-center justify-center"
                onPress={onClear}
              >
                <Text className="text-ink/70 font-semibold">지우기</Text>
              </Pressable>
              <Pressable
                className="flex-1 h-11 rounded-input bg-primary items-center justify-center"
                onPress={() => setOpen(false)}
              >
                <Text className="text-white font-semibold">완료</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
