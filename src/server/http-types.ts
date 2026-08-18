export interface VercelRequestLike {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | undefined>;
  body?: Record<string, unknown>;
}

export interface VercelResponseLike {
  status(code: number): VercelResponseLike;
  json(value: unknown): VercelResponseLike;
  setHeader(name: string, value: string | string[]): VercelResponseLike;
  redirect(status: number, location: string): VercelResponseLike;
}
