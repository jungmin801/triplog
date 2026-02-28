export type Journey = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  country_code: string;
  thumbnail_url: string | null;
  thumbnail?: string;
  invite_code: string;
  /** 참여 멤버 수 (목록 API에서 채움) */
  member_count?: number;
  /** 업로드된 기억 개수 (목록 API에서 채움) */
  memory_count?: number;
};
