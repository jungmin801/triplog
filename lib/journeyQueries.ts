import { supabase } from "@/lib/supabase";
import { Journey } from "@/types";

export const journeyQueryKeys = {
  all: ["journeys"] as const,
  list: () => [...journeyQueryKeys.all] as const,
  detail: (id: string) => [...journeyQueryKeys.all, id] as const,
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" })} - ${e.toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatMemoryDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type JourneyDetailResult = {
  journey: { title: string; dateRange: string } | null;
  inviteCode: string | null;
  memories: Array<{
    id: string;
    imageUri: string;
    title: string;
    subtitle: string;
    date: string;
    mood: string;
  }>;
};

export async function fetchJourneys(): Promise<Journey[]> {
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching journeys:", error);
    return [];
  }

  const journeys = (data ?? []) as Journey[];
  const journeyIds = journeys.map((j) => j.id);

  // 참여 멤버 수, 기억 개수 조회
  const [memberCountByJourney, memoryCountByJourney] = await Promise.all([
    (async () => {
      if (journeyIds.length === 0) return {} as Record<string, number>;
      const { data: rows } = await supabase
        .from("journey_members")
        .select("journey_id")
        .in("journey_id", journeyIds);
      const map: Record<string, number> = {};
      for (const r of rows ?? []) {
        const id = (r as { journey_id: string }).journey_id;
        map[id] = (map[id] ?? 0) + 1;
      }
      return map;
    })(),
    (async () => {
      if (journeyIds.length === 0) return {} as Record<string, number>;
      const { data: rows } = await supabase
        .from("memories")
        .select("journey_id")
        .in("journey_id", journeyIds);
      const map: Record<string, number> = {};
      for (const r of rows ?? []) {
        const id = (r as { journey_id: string }).journey_id;
        map[id] = (map[id] ?? 0) + 1;
      }
      return map;
    })(),
  ]);

  const paths = journeys
    .map((j) => j.thumbnail_url)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  let urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signedList, error: signedErr } = await supabase.storage
      .from("media")
      .createSignedUrls(paths, 60 * 60);
    if (!signedErr && signedList) {
      urlByPath = new Map(
        signedList.map((x) => [x.path, x.signedUrl] as const),
      );
    }
  }

  return journeys.map((j) => ({
    ...j,
    thumbnail: j.thumbnail_url ? urlByPath.get(j.thumbnail_url) ?? null : null,
    member_count: memberCountByJourney[j.id] ?? 0,
    memory_count: memoryCountByJourney[j.id] ?? 0,
  })) as Journey[];
}

export async function fetchJourneyDetail(
  journeyId: string,
): Promise<JourneyDetailResult> {
  const [
    { data: journeyData, error: journeyError },
    { data: memoriesData, error: memoriesError },
  ] = await Promise.all([
    supabase
      .from("journeys")
      .select("title, start_date, end_date, invite_code")
      .eq("id", journeyId)
      .single(),
    supabase
      .from("memories")
      .select("id, image_url, description, mood, memory_date, created_at")
      .eq("journey_id", journeyId)
      .order("memory_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const result: JourneyDetailResult = {
    journey: null,
    inviteCode: null,
    memories: [],
  };

  if (!journeyError && journeyData) {
    result.journey = {
      title: journeyData.title ?? "",
      dateRange: formatDateRange(
        journeyData.start_date,
        journeyData.end_date,
      ),
    };
    result.inviteCode = journeyData.invite_code ?? null;
  }

  if (memoriesError || !memoriesData) return result;

  const SIGNED_URL_EXPIRES = 60 * 60;
  result.memories = await Promise.all(
    memoriesData.map(async (m) => {
      const desc = (m.description ?? "").trim();
      const firstLine = desc.split("\n")[0]?.trim() || "기억";
      const subtitle = desc.includes("\n")
        ? desc.split("\n").slice(1).join(" ").trim().slice(0, 80)
        : desc.slice(0, 80);
      const imagePath = m.image_url ?? "";
      let imageUri = "";
      if (imagePath) {
        try {
          const { data: signed } = await supabase.storage
            .from("media")
            .createSignedUrl(imagePath, SIGNED_URL_EXPIRES);
          imageUri = signed?.signedUrl ?? "";
        } catch {
          // ignore
        }
      }
      const displayDate = m.memory_date ?? m.created_at ?? "";
      return {
        id: m.id,
        imageUri,
        title: firstLine,
        subtitle: subtitle || " ",
        date: displayDate ? formatMemoryDate(displayDate) : "",
        mood: m.mood ?? "",
      };
    }),
  );

  return result;
}
