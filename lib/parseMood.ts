import { MOOD_OPTIONS } from "@/constants/mood";

export default function parseMood(mood: string) {
  return MOOD_OPTIONS.find((option) => option.key === mood);
}
