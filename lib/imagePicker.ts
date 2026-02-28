import * as ImagePicker from "expo-image-picker";

export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert("Permission required");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    aspect: [1, 1],
    quality: 0.9,
    exif: true,
  });

  if (result.canceled) return null;

  return result.assets[0];
}
