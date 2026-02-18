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

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahrain",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Ethiopia",
  "Finland",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Guatemala",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Libya",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Maldives",
  "Malta",
  "Mexico",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palestine",
  "Panama",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
].sort((a, b) => a.localeCompare(b));

export type CountrySelectProps = {
  label?: string;
  value: string | null;
  onChange: (country: string | null) => void;
  placeholder?: string;
  containerClassName?: string;
};

export function CountrySelect({
  label = "COUNTRY",
  value,
  onChange,
  placeholder = "Select country",
  containerClassName = "",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const onSelect = (country: string) => {
    onChange(country);
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
      <Pressable
        className={containerClassName}
        onPress={() => setOpen(true)}
      >
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
            {value ?? placeholder}
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
                  Select country
                </Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>
              <TextInput
                className="rounded-input border-2 border-ink/10 bg-surface-alt px-3 h-11 text-body text-ink placeholder:text-ink/40"
                placeholder="Search country..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              className="max-h-80"
              ListEmptyComponent={
                <Text className="text-body text-ink/50 p-4 text-center">
                  No countries found
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  className="px-4 py-3.5 border-b border-ink/5 active:bg-ink/5 flex-row items-center justify-between"
                  onPress={() => onSelect(item)}
                >
                  <Text className="text-body text-ink" numberOfLines={1}>
                    {item}
                  </Text>
                  {value === item ? (
                    <Ionicons name="checkmark-circle" size={20} color="#ee845d" />
                  ) : null}
                </Pressable>
              )}
            />
            <View className="flex-row gap-2 p-4 border-t border-ink/5">
              <Pressable
                className="flex-1 h-11 rounded-input border border-ink/10 items-center justify-center"
                onPress={onClear}
              >
                <Text className="text-ink/70 font-semibold">Clear</Text>
              </Pressable>
              <Pressable
                className="flex-1 h-11 rounded-input bg-primary items-center justify-center"
                onPress={() => setOpen(false)}
              >
                <Text className="text-white font-semibold">Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
