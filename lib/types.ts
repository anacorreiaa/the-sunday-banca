export type Article = {
  id: string;
  postId: string;
  title: string;
  subtitle: string | null;
  date: string;
  url: string;
  isPaid: boolean;
  tags: string[];
  coverImage: string | null;
};

export type CoverStyle = 'overlay' | 'split' | 'title';
export type CoverRatio = 'grid' | 'stories';

export type CoverVariant = {
  style: CoverStyle;
  ratio: CoverRatio;
  src: string;
  width: number;
  height: number;
  remote?: boolean;
};
