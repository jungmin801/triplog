import { Image, View, type ImageSourcePropType } from "react-native";
import { Text } from "./Text";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = {
  source?: ImageSourcePropType | { uri: string };
  fallback?: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-32 h-32",
};

const fallbackTextClasses: Record<AvatarSize, string> = {
  sm: "text-caption",
  md: "text-body-sm",
  lg: "text-body",
  xl: "text-h2",
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({
  source,
  fallback = "?",
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const textClass = fallbackTextClasses[size];

  return (
    <View
      className={`rounded-pill overflow-hidden bg-surface-alt border border-ink/5 items-center justify-center ${sizeClass} ${className}`}
    >
      {source ? (
        <Image
          source={source ? { uri: source as string } : source}
          className={`${sizeClass}`}
          resizeMode="cover"
        />
      ) : (
        <Text className={`font-bold text-ink/60 ${textClass}`}>
          {getInitials(fallback)}
        </Text>
      )}
    </View>
  );
}
