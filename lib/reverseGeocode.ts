const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * 위·경도로 주소(place name) 조회. Google Geocoding API 사용.
 * Geocoding API 사용 설정 및 API 키 필요.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  const url = `${GEOCODE_URL}?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=ko`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ formatted_address?: string }>;
    };
    if (data.status !== "OK" || !data.results?.length) return null;
    return data.results[0].formatted_address ?? null;
  } catch {
    return null;
  }
}
