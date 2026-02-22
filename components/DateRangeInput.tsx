import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

type DateRange = { start?: string; end?: string }; // YYYY-MM-DD

function formatLabel(range: DateRange) {
  if (!range.start) return "Select dates";
  if (!range.end) return `${range.start} ~`;
  return `${range.start} ~ ${range.end}`;
}

function buildMarkedDates(range: DateRange) {
  const marked: Record<string, any> = {};
  const { start, end } = range;
  if (!start) return marked;

  // start만 선택된 상태
  if (!end) {
    marked[start] = {
      startingDay: true,
      endingDay: true,
      color: "#ee845d",
      textColor: "white",
    };
    return marked;
  }

  // start~end 범위 표시
  const startDate = new Date(start);
  const endDate = new Date(end);
  const step = new Date(startDate);

  while (step <= endDate) {
    const key = step.toISOString().slice(0, 10);
    const isStart = key === start;
    const isEnd = key === end;

    marked[key] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: "#ee845d",
      textColor: "white",
    };

    step.setDate(step.getDate() + 1);
  }

  return marked;
}

export function DateRangeInput({
  value,
  onChange,
}: {
  value?: DateRange | null;
  onChange: (next: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const safeValue: DateRange = value ?? { start: undefined, end: undefined };

  const dateLabel = useMemo(() => formatLabel(safeValue), [safeValue]);
  const markedDates = useMemo(() => buildMarkedDates(safeValue), [safeValue]);

  const onDayPress = (day: { dateString: string }) => {
    const d = day.dateString; // YYYY-MM-DD

    // 아무것도 없거나, start+end가 이미 있으면 새로 시작
    if (!safeValue.start || (safeValue.start && safeValue.end)) {
      onChange({ start: d, end: undefined });
      return;
    }

    // start만 있는 상태에서 end 선택
    if (safeValue.start && !safeValue.end) {
      // end가 start보다 이전이면 swap
      if (d < safeValue.start) onChange({ start: d, end: safeValue.start });
      else onChange({ start: safeValue.start, end: d });
    }
  };

  return (
    <>
      {/* Trigger */}
      <Pressable onPress={() => setOpen(true)}>
        <Text className="text-overline font-bold text-ink/40 mb-1.5">
          DATE RANGE
        </Text>
        <View className="flex-row items-center rounded-input border-2 border-ink/5 bg-background px-space-card h-12">
          <Ionicons name="calendar-outline" size={18} color="#8e8881" />
          <Text className="text-body text-ink/60 ml-3 flex-1">{dateLabel}</Text>
          <Ionicons name="chevron-down" size={18} color="#8e8881" />
        </View>
      </Pressable>

      {/* Modal */}
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
            className="bg-background rounded-t-2xl p-4"
            onPress={() => {}}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-ink">
                Select dates
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={onDayPress}
            />

            <View className="flex-row gap-2 mt-4">
              <Pressable
                className="flex-1 h-11 rounded-input border border-ink/10 items-center justify-center"
                onPress={() => onChange({ start: undefined, end: undefined })}
              >
                <Text className="text-ink/70 font-semibold">Clear</Text>
              </Pressable>

              <Pressable
                className="flex-1 h-11 rounded-input bg-primary items-center justify-center"
                onPress={() => setOpen(false)}
                disabled={!safeValue.start}
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
