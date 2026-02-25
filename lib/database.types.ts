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

export type Post = {
  id: number;
  user_id: string;
  image_url: string;
  created_at: string;
};

// 投稿とプロフィール情報を結合した型
export type PostWithProfile = Post & {
  profiles: Profile | null;
};
