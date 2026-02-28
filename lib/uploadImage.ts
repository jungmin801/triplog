import { supabase } from "@/lib/supabase";

export async function uploadImageToSupabase({
  bucket,
  uri,
  path,
  mimeType,
}: {
  bucket: string;
  uri: string;
  path: string;
  mimeType?: string | null;
}) {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to read file: ${res.status}`);

  const arrayBuffer = await res.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Invalid image buffer (0 bytes).");
  }

  const contentType = mimeType ?? "image/jpeg";

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;
  return data.path;
}
