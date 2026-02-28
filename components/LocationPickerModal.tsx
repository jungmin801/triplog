"use client";

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { Text } from "./Text";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const PLACES_DETAILS_BASE = "https://places.googleapis.com/v1/places";

const DEFAULT_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type PlaceSuggestion = { placeId: string; description: string };

async function fetchAutocomplete(
  apiKey: string,
  input: string,
): Promise<PlaceSuggestion[]> {
  if (!input.trim()) return [];
  try {
    const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      body: JSON.stringify({
        input: input.trim(),
        languageCode: "ko",
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: { placeId?: string; text?: { text?: string } };
      }>;
    };
    const list: PlaceSuggestion[] = [];
    for (const s of data.suggestions ?? []) {
      const p = s.placePrediction;
      if (p?.placeId && p?.text?.text) {
        list.push({ placeId: p.placeId, description: p.text.text });
      }
    }
    return list;
  } catch {
    throw new Error("NETWORK_ERROR");
  }
}

async function fetchPlaceDetails(
  apiKey: string,
  placeId: string,
): Promise<{
  latitude: number;
  longitude: number;
  displayName?: string;
} | null> {
  const url = `${PLACES_DETAILS_BASE}/${encodeURIComponent(placeId)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "location,displayName",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      location?: { latitude?: number; longitude?: number };
      displayName?: { text?: string };
    };
    const loc = data.location;
    if (
      loc == null ||
      typeof loc.latitude !== "number" ||
      typeof loc.longitude !== "number"
    ) {
      return null;
    }
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      displayName: data.displayName?.text,
    };
  } catch {
    throw new Error("NETWORK_ERROR");
  }
}

export type PickedPlace = {
  latitude: number;
  longitude: number;
  place_id: string;
  place_name?: string;
};

type LocationPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: PickedPlace) => void;
};

const DEBOUNCE_MS = 300;

export function LocationPickerModal({
  visible,
  onClose,
  onSelect,
}: LocationPickerModalProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedPlace, setSelectedPlace] = useState<PickedPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const loadSuggestions = useCallback(async (query: string) => {
    if (!GOOGLE_PLACES_API_KEY) return;
    setLoading(true);
    setSearchError(null);
    try {
      const list = await fetchAutocomplete(GOOGLE_PLACES_API_KEY, query);
      setSuggestions(list);
    } catch {
      setSearchError("네트워크 연결을 확인해 주세요.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) setSearchError(null);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      loadSuggestions(searchQuery);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [visible, searchQuery, loadSuggestions]);

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    if (!GOOGLE_PLACES_API_KEY) return;
    setLoading(true);
    setSuggestions([]);
    setSearchError(null);
    setSearchQuery(suggestion.description);
    try {
      const details = await fetchPlaceDetails(
        GOOGLE_PLACES_API_KEY,
        suggestion.placeId,
      );
      if (!details) return;
      const place: PickedPlace = {
        latitude: details.latitude,
        longitude: details.longitude,
        place_id: suggestion.placeId,
        place_name: details.displayName ?? suggestion.description,
      };
      setSelectedPlace(place);
      mapRef.current?.animateToRegion({
        latitude: details.latitude,
        longitude: details.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch {
      setSearchError("위치 정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const MapContent = (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={DEFAULT_REGION}
      showsUserLocation
    >
      {selectedPlace && (
        <Marker
          coordinate={{
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
          }}
          title={selectedPlace.place_name}
        />
      )}
    </MapView>
  );

  const handleConfirm = () => {
    if (selectedPlace) {
      onSelect(selectedPlace);
      setSelectedPlace(null);
      onClose();
    }
  };

  if (!GOOGLE_PLACES_API_KEY) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-2xl p-4">
            <Text className="text-body text-ink mb-2">
              EXPO_PUBLIC_GOOGLE_PLACES_API_KEY를 .env에 설정해 주세요.
            </Text>
            <Pressable
              className="rounded-input bg-primary py-3 items-center"
              onPress={onClose}
            >
              <Text className="text-white font-semibold">닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1">{MapContent}</View>

        <View
          className="absolute inset-0 flex flex-col"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
          pointerEvents="box-none"
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-h4 font-semibold text-ink">
                지도에서 위치 선택
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <View className="mt-2">
              <View className="rounded-xl bg-surface/95 border border-ink/10 overflow-hidden">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="장소 검색..."
                  placeholderTextColor="#9ca3af"
                  className="px-3 py-2.5 h-11 text-body text-ink"
                />
              </View>
              {loading && (
                <View className="absolute right-6 top-3">
                  <ActivityIndicator size="small" color="#6B7280" />
                </View>
              )}
              {searchError ? (
                <Text className="mt-1.5 text-body-sm text-red-500">
                  {searchError}
                </Text>
              ) : null}
              {suggestions.length > 0 && (
                <View className="mt-1 max-h-40 rounded-xl border border-ink/10 bg-surface overflow-hidden">
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.placeId}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        className="px-3 py-3 border-b border-ink/5 last:border-b-0 active:bg-ink/5"
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <Text className="text-body text-ink" numberOfLines={2}>
                          {item.description}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          <View className="flex-1 justify-end p-4">
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 py-3 rounded-xl border border-ink/20 bg-surface/95 items-center justify-center active:opacity-80"
                onPress={onClose}
              >
                <Text className="text-ink/80 font-semibold">취소</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-xl bg-primary items-center justify-center"
                onPress={handleConfirm}
                disabled={!selectedPlace}
                style={{ opacity: selectedPlace ? 1 : 0.5 }}
              >
                <Text className="text-white font-semibold">이 위치로 선택</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
