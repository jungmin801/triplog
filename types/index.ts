export type Journey = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  country_code: string;
  thumbnail_url: string | null;
  thumbnail?: string;
  invite_code: string;
};
