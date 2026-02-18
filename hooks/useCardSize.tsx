import { useWindowDimensions } from "react-native";

export default function useCardSize() {
  const CARD_GAP = 16;
  const HORIZONTAL_PADDING = 24;
  const CARD_MAX_WIDTH = 320;
  const CARD_MIN_WIDTH = 220;

  const { width } = useWindowDimensions();
  const cardWidth = Math.min(
    CARD_MAX_WIDTH,
    Math.max(CARD_MIN_WIDTH, width - HORIZONTAL_PADDING * 2),
  );

  return {
    cardWidth: cardWidth,
    cardGap: CARD_GAP,
    horizontalPadding: HORIZONTAL_PADDING,
  };
}
