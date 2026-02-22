import { Share } from "react-native";

export async function shareInvite(code: string) {
  const link = `triplog://join?code=${code}`;
  const message = `Triplog 여행 초대!\n${link}\n(또는 코드: ${code})`;

  console.log(link, code);
  await Share.share({
    message,
  });
}
