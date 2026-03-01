export type Journey = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  country_code: string;
  thumbnail_url: string | null;
  thumbnail?: string;
  invite_code: string;
  /** 생성자(owner) user id (목록/상세 API에서 채움) */
  created_by?: string;
  /** owner 표시 이름 (목록/상세 API에서 채움) */
  owner_name?: string;
  member_count?: number;
  memory_count?: number;
};
