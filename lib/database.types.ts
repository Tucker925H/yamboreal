export type Profile = {
  uuid: string;
  display_name: string;
  crew_id: number;
  created_at?: string;
};

export type Crew = {
  id: number;
  name: string;
};

// プロフィールとクルー情報を結合した型
export type ProfileWithCrew = Profile & {
  crews: Crew | null;
};
