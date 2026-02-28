export default function parseGpsFromExif(exif?: any) {
  if (!exif) return null;

  const lat = exif.GPSLatitude;
  const lng = exif.GPSLongitude;
  const latRef = exif.GPSLatitudeRef; // 'N' | 'S'
  const lngRef = exif.GPSLongitudeRef; // 'E' | 'W'

  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  let finalLat = Math.abs(lat);
  let finalLng = Math.abs(lng);

  if (latRef?.toUpperCase() === "S") {
    finalLat = -finalLat;
  }

  if (lngRef?.toUpperCase() === "W") {
    finalLng = -finalLng;
  }

  return { lat: finalLat, lng: finalLng };
}
