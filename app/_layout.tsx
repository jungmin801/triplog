import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { AuthProvider } from "@/provider/authProvider";
import "react-native-reanimated";
import "../global.css";

// 앱 로드 시 스플래시 자동 숨김 막기 (폰트 로드 후 숨김)
SplashScreen.preventAutoHideAsync();

const DEFAULT_FONT_FAMILY = "AppFont";

const fontMap = {
  [DEFAULT_FONT_FAMILY]: require("../assets/fonts/GodoM.ttf"),
};

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded] = Font.useFonts(fontMap);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}
