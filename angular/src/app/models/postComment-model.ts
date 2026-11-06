export interface postComment {
  id: number;
  post: number;
  parent: number;
  author_name: string;
  author_url: string;
  date: string;
  content: {
    rendered: string;
  };
}
