export type Profile = {
  session_token: string;
  display_name: string;
  crew_id: number;
  created_at: string;
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
  session_token: string;
  image_url: string;
  created_at: string;
};

// 投稿とプロフィール・班情報を結合した型
export type PostWithProfile = Post & {
  profiles: (Profile & { crews: Crew | null }) | null;
};
