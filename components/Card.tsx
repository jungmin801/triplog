import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
  type TextProps,
  type ViewProps,
} from "react-native";
import { Button } from "./Button";

type CardVariant = "elevated" | "outlined" | "polaroid";

export type CardProps = ViewProps & {
  variant?: CardVariant;
  onPress?: () => void;
  children: React.ReactNode;
  cardWidth?: string;
};

function CardRoot({
  variant = "elevated",
  onPress,
  children,
  className = "",
  cardWidth = "220",
  ...props
}: CardProps) {
  const baseClasses = "rounded-card overflow-hidden";
  const variantClasses: Record<CardVariant, string> = {
    elevated: "bg-background border border-ink/10",
    outlined: "bg-background border border-ink/10",
    polaroid: "bg-background border border-ink/5 rounded-card",
  };

  const Wrapper = onPress ? Pressable : View;
  const isPolaroid = variant === "polaroid";
  return (
    <Wrapper
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onPress={onPress}
      style={{
        width: cardWidth,
      }}
      {...(props as any)}
    >
      {isPolaroid ? <View className="p-4 h-full">{children}</View> : children}
    </Wrapper>
  );
}

export type CardImageProps = ViewProps & {
  source?: ImageSourcePropType | { uri: string };
  children?: React.ReactNode;
};

function CardImage({
  source,
  children,
  className = "",
  ...props
}: CardImageProps) {
  return (
    <View className={`overflow-hidden max-h-[512px] ${className}`} {...props}>
      {source ? (
        <Image
          source={
            typeof source === "object" && "uri" in source
              ? source
              : (source as any)
          }
          className="w-full aspect-[3/4] rounded-card"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full aspect-[3/4] rounded-card " />
      )}
      {children}
    </View>
  );
}

export type CardContentProps = ViewProps & {
  children: React.ReactNode;
};

function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <View className={`flex-1 py-2 ${className}`} {...props}>
      {children}
    </View>
  );
}

export type CardTitleProps = TextProps & {
  children: string;
};

function CardTitle({ children, className = "", ...props }: CardTitleProps) {
  return (
    <Text
      className={`text-h3 font-bold text-ink ${className}`}
      numberOfLines={1}
      {...props}
    >
      {children}
    </Text>
  );
}

export type CardSubtitleProps = TextProps & {
  children: string;
};

function CardSubtitle({
  children,
  className = "",
  ...props
}: CardSubtitleProps) {
  return (
    <Text
      className={`text-body-sm text-ink/60 mt-1 ${className}`}
      numberOfLines={2}
      {...props}
    >
      {children}
    </Text>
  );
}

export type CardFooterProps = ViewProps & {
  children: React.ReactNode;
};

function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <View className={`flex-row flex-wrap gap-2 mt-2 ${className}`} {...props} />
  );
}

/** Polaroid-style list row: avatar + title + subtitle (design system list item) */
export type CardPolaroidRowProps = ViewProps & {
  imageSource?: ImageSourcePropType | { uri: string };
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function CardPolaroidRow({
  imageSource,
  title,
  subtitle,
  onPress,
  className = "",
  ...props
}: CardPolaroidRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      className={`flex-row items-center gap-3 bg-background border border-ink/5 rounded-card-sm p-3 ${className}`}
      onPress={onPress}
      {...(props as any)}
    >
      <View className="w-12 h-12 rounded overflow-hidden bg-surface-alt">
        {imageSource ? (
          <Image
            source={
              typeof imageSource === "object" && "uri" in imageSource
                ? imageSource
                : (imageSource as any)
            }
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : null}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-h4 font-bold text-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-overline text-ink/50 mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Wrapper>
  );
}

export type CardActionProps = ViewProps & {
  onPress: () => void;
  children: string;
};

function CardAction({ children, onPress, className = "" }: CardActionProps) {
  return (
    <View className={`mt-3 ${className}`}>
      <Button onPress={onPress} size="md">
        {children}
      </Button>
    </View>
  );
}

export const Card = {
  Root: CardRoot,
  Image: CardImage,
  Content: CardContent,
  Title: CardTitle,
  Subtitle: CardSubtitle,
  Footer: CardFooter,
  Action: CardAction,
  PolaroidRow: CardPolaroidRow,
};
