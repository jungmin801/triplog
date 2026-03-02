import { Pressable, View, type ViewProps } from "react-native";
import { Text } from "./Text";

type TagVariant = "primary" | "muted" | "owner";

export type TagProps = ViewProps & {
  variant?: TagVariant;
  onPress?: () => void;
  children: string;
};

const variantClasses: Record<TagVariant, string> = {
  primary: "bg-primary/10",
  muted: "bg-ink/5",
  owner: "bg-emerald-500/15",
};

const variantTextClasses: Record<TagVariant, string> = {
  primary: "text-primary",
  muted: "text-ink/60",
  owner: "text-emerald-700",
};

export function Tag({
  variant = "primary",
  onPress,
  children,
  className = "",
  ...props
}: TagProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      className={`rounded-tag px-2.5 py-1.5 bg-white/80 ${variantClasses[variant]} ${className}`}
      onPress={onPress}
      {...(props as any)}
    >
      <Text
        className={`text-overline font-bold ${variantTextClasses[variant]}`}
        numberOfLines={1}
      >
        {children}
      </Text>
    </Wrapper>
  );
}
