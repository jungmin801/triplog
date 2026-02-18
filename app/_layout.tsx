import { Stack } from 'expo-router';
import 'react-native-reanimated';
import '../global.css';

export default function RootLayout() {
  return (
    <Stack
    screenOptions={{
      headerShown: false, // ✅ 기본 헤더 끄기
    }}
  />
  )
}
