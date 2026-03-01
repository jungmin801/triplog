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
  journey: {
    title: string;
    dateRange: string;
    created_by?: string;
    owner_name?: string;
  } | null;
  inviteCode: string | null;
  memories: Array<{
    id: string;
    imageUri: string;
    title: string;
    subtitle: string;
    date: string;
    mood: string;
    author_name?: string;
    /** 작성자 user id (수정: 작성자만, 삭제: 작성자 또는 journey owner) */
    created_by?: string;
  }>;
};

export async function fetchJourneys(): Promise<Journey[]> {
  const { data, error } = await supabase
    .from("journeys")
    .select("id, title, start_date, end_date, country_code, thumbnail_url, invite_code, created_by")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching journeys:", error);
    return [];
  }

  const journeys = (data ?? []) as (Journey & { created_by?: string })[];
  const journeyIds = journeys.map((j) => j.id);
  const ownerIds = [...new Set((journeys.map((j) => j.created_by).filter(Boolean) as string[]))];
  let ownerNameById: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    ownerNameById = (profiles ?? []).reduce(
      (acc, p) => {
        acc[p.id] = (p as { full_name: string }).full_name ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  }

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
    owner_name: j.created_by ? ownerNameById[j.created_by] ?? "" : "",
  })) as Journey[];
}

export async function deleteJourney(journeyId: string): Promise<void> {
  const { error } = await supabase.from("journeys").delete().eq("id", journeyId);
  if (error) throw error;
}

export type JourneyForEdit = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  country_code: string;
  thumbnail_url: string | null;
  thumbnail_signed_url?: string | null;
};

export async function fetchJourneyForEdit(
  journeyId: string,
): Promise<JourneyForEdit | null> {
  const { data, error } = await supabase
    .from("journeys")
    .select("id, title, start_date, end_date, country_code, thumbnail_url")
    .eq("id", journeyId)
    .single();

  if (error || !data) return null;

  const j = data as JourneyForEdit;
  let thumbnail_signed_url: string | null = null;
  if (j.thumbnail_url) {
    const { data: signed } = await supabase.storage
      .from("media")
      .createSignedUrl(j.thumbnail_url, 60 * 60);
    thumbnail_signed_url = signed?.signedUrl ?? null;
  }
  return { ...j, thumbnail_signed_url };
}

export async function updateJourney(
  journeyId: string,
  data: {
    title: string;
    start_date: string;
    end_date: string;
    country_code: string;
    thumbnail_url?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("journeys")
    .update({
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      country_code: data.country_code,
      ...(data.thumbnail_url !== undefined && { thumbnail_url: data.thumbnail_url }),
    })
    .eq("id", journeyId);
  if (error) throw error;
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
      .select("title, start_date, end_date, invite_code, created_by")
      .eq("id", journeyId)
      .single(),
    supabase
      .from("memories")
      .select("id, image_url, description, mood, memory_date, created_at, created_by")
      .eq("journey_id", journeyId)
      .order("memory_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const result: JourneyDetailResult = {
    journey: null,
    inviteCode: null,
    memories: [],
  };

  let ownerName = "";
  if (!journeyError && journeyData) {
    const createdBy = (journeyData as { created_by?: string }).created_by;
    if (createdBy) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", createdBy)
        .single();
      ownerName = (ownerProfile as { full_name?: string } | null)?.full_name ?? "";
    }
    result.journey = {
      title: journeyData.title ?? "",
      dateRange: formatDateRange(
        journeyData.start_date,
        journeyData.end_date,
      ),
      created_by: createdBy,
      owner_name: ownerName,
    };
    result.inviteCode = journeyData.invite_code ?? null;
  }

  if (memoriesError || !memoriesData) return result;

  const authorIds = [...new Set((memoriesData.map((m) => (m as { created_by?: string }).created_by).filter(Boolean) as string[]))];
  let authorNameById: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authorProfiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds);
    authorNameById = (authorProfiles ?? []).reduce(
      (acc, p) => {
        acc[p.id] = (p as { full_name: string }).full_name ?? "";
        return acc;
      },
      {} as Record<string, string>,
    );
  }

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
      const createdBy = (m as { created_by?: string }).created_by;
      return {
        id: m.id,
        imageUri,
        title: firstLine,
        subtitle: subtitle || " ",
        date: displayDate ? formatMemoryDate(displayDate) : "",
        mood: m.mood ?? "",
        author_name: createdBy ? authorNameById[createdBy] ?? "" : "",
        created_by: createdBy,
      };
    }),
  );

  return result;
}

/** Memory 삭제 (작성자 또는 Journey owner만 가능, RLS로 검증) */
export async function deleteMemory(memoryId: string): Promise<void> {
  const { error } = await supabase.from("memories").delete().eq("id", memoryId);
  if (error) throw error;
}

export type MemoryForEdit = {
  id: string;
  journey_id: string;
  title: string;
  description: string;
  mood: string;
  memory_date: string;
  image_url: string | null;
  image_signed_url: string | null;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
};

/** 수정 폼용 메모리 1건 조회 (작성자만 수정 가능, RLS로 검증) */
export async function fetchMemoryForEdit(
  memoryId: string,
): Promise<MemoryForEdit | null> {
  const { data, error } = await supabase
    .from("memories")
    .select(
      "id, journey_id, description, mood, memory_date, image_url, latitude, longitude, place_id",
    )
    .eq("id", memoryId)
    .single();

  if (error || !data) return null;

  const m = data as MemoryForEdit & { description: string };
  const desc = (m.description ?? "").trim();
  const firstLine = desc.split("\n")[0]?.trim() ?? "";
  const rest = desc.includes("\n")
    ? desc.split("\n").slice(1).join("\n").trim()
    : desc.slice(firstLine.length).trim();
  let image_signed_url: string | null = null;
  if (m.image_url) {
    const { data: signed } = await supabase.storage
      .from("media")
      .createSignedUrl(m.image_url, 60 * 60);
    image_signed_url = signed?.signedUrl ?? null;
  }
  return {
    ...m,
    title: firstLine,
    description: rest,
    image_signed_url,
  };
}

/** Memory 수정 (작성자만 가능, RLS로 검증) */
export async function updateMemory(
  memoryId: string,
  data: {
    description: string;
    mood: string;
    memory_date: string;
    image_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    place_id?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("memories")
    .update({
      description: data.description,
      mood: data.mood,
      memory_date: data.memory_date,
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.place_id !== undefined && { place_id: data.place_id }),
    })
    .eq("id", memoryId);
  if (error) throw error;
}
