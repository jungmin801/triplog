import React from "react";
import {
  Text as RNText,
  type TextProps,
  type StyleProp,
  type TextStyle,
} from "react-native";

/** Tailwind font-sans와 동일. RN은 fontFamily 상속이 없어서 여기서 기본 폰트를 항상 병합 */
const DEFAULT_FONT_FAMILY = "AppFont";

function mergeStyle(
  style: StyleProp<TextStyle> | undefined,
): StyleProp<TextStyle> {
  const base = { fontFamily: DEFAULT_FONT_FAMILY };
  if (style == null) return base;
  if (Array.isArray(style)) return [base, ...style];
  return [base, style];
}

export const Text = React.forwardRef<RNText, TextProps>(function AppText(
  { style, ...props },
  ref,
) {
  return <RNText ref={ref} {...props} style={mergeStyle(style)} />;
});
