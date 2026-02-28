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
  const paths = journeys
    .map((j) => j.thumbnail_url)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  if (paths.length === 0) return journeys;

  const { data: signedList, error: signedErr } = await supabase.storage
    .from("media")
    .createSignedUrls(paths, 60 * 60);

  if (signedErr) {
    console.error("Error creating signed urls:", signedErr);
    return journeys;
  }

  const urlByPath = new Map(
    (signedList ?? []).map((x) => [x.path, x.signedUrl] as const),
  );

  return journeys.map((j) => ({
    ...j,
    thumbnail: j.thumbnail_url ? urlByPath.get(j.thumbnail_url) ?? null : null,
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
      const firstLine = desc.split("\n")[0]?.trim() || "Memory";
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
