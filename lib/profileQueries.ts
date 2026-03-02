import { supabase } from "@/lib/supabase";

export const profileQueryKeys = {
  all: ["profile"] as const,
  stats: (userId: string) => [...profileQueryKeys.all, "stats", userId] as const,
  myJourneys: (userId: string) =>
    [...profileQueryKeys.all, "myJourneys", userId] as const,
};

export type ProfileStats = {
  journeyCount: number;
  memoryCount: number;
};

export type MyJourneyItem = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  country_code: string | null;
  thumbnail_url: string | null;
  thumbnail: string | null;
  /** journey 생성자(owner) user id */
  created_by: string | null;
};

export async function fetchProfileStats(
  userId: string,
): Promise<ProfileStats> {
  const [journeyRes, memoryRes] = await Promise.all([
    supabase
      .from("journey_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("memories")
      .select("*", { count: "exact", head: true })
      .eq("created_by", userId),
  ]);

  return {
    journeyCount: journeyRes.count ?? 0,
    memoryCount: memoryRes.count ?? 0,
  };
}

export async function fetchMyJourneys(userId: string): Promise<MyJourneyItem[]> {
  const { data: members, error: membersError } = await supabase
    .from("journey_members")
    .select("journey_id")
    .eq("user_id", userId);

  if (membersError || !members?.length) return [];

  const journeyIds = members.map((m) => m.journey_id);

  const { data: journeys, error: journeysError } = await supabase
    .from("journeys")
    .select("id, title, start_date, end_date, country_code, thumbnail_url, created_by")
    .in("id", journeyIds)
    .order("created_at", { ascending: false });

  if (journeysError || !journeys?.length) return [];

  const paths = (journeys as MyJourneyItem[])
    .map((j) => j.thumbnail_url)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (paths.length === 0) {
    return journeys.map((j) => ({
      ...j,
      thumbnail: null,
    })) as MyJourneyItem[];
  }

  const { data: signedList } = await supabase.storage
    .from("media")
    .createSignedUrls(paths, 60 * 60);

  const urlByPath = new Map(
    (signedList ?? []).map((x) => [x.path, x.signedUrl] as const),
  );

  return journeys.map((j) => ({
    ...j,
    thumbnail: j.thumbnail_url ? urlByPath.get(j.thumbnail_url) ?? null : null,
  })) as MyJourneyItem[];
}
