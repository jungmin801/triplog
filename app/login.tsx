import { Button } from "@/components";
import { supabase } from "@/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();

  const handleLogin = async () => {
    // 환경에 맞는 redirectUri 생성
    const redirectTo = makeRedirectUri({
      scheme: "triplog", // app.json에 등록한 scheme
      preferLocalhost: true, // Expo Go에서 테스트할 경우 localhost/exp:// 주소 반환
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo, // 반드시 추가해야 앱으로 돌아옴
        queryParams: {
          prompt: "select_account", // 항상 계정 선택창 표시
        },
      },
    });

    if (error) {
      console.error("로그인 실패:", error);
    } else if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );
      console.log("브라우저 결과:", result);
      if (result.type === "success" && result.url) {
        // fragment 부분(# 뒤) 파싱
        const hash = result.url.split("#")[1] ?? "";
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.log("setSession 실패:", error);
          } else {
            router.replace("/");
          }
        } else {
          console.log("토큰이 없음. url=", result.url);
        }
      }
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-space-card pt-16 pb-8 items-center justify-center min-h-[80%]">
            {/* Logo area with primary tint */}
            <View className="w-20 h-20 rounded-pill bg-primary/10 items-center justify-center mb-6">
              <Text className="text-4xl">✈️</Text>
            </View>
            <Text className="text-h1 font-bold text-ink text-center mb-3">
              Triplog
            </Text>
            <Text className="text-body text-ink/60 text-center mb-10 max-w-[240px]">
              Your minimalist companion for every journey.
            </Text>

            <View className="w-full max-w-[270px]">
              <Button
                variant="secondary"
                size="lg"
                onPress={handleLogin}
                className="w-full"
              >
                <Image
                  source={require("../assets/images/google.png")}
                  className="w-5 h-5"
                />
                <Text className="text-btn font-bold text-ink">
                  Continue with Google
                </Text>
              </Button>

              <Text className="text-caption text-ink/60 text-center mt-4 px-2">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
