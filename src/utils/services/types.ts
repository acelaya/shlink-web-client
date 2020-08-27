export interface ShlinkMercureInfo {
  token: string;
  mercureHubUrl: string;
}

export interface ShlinkHealth {
  status: 'pass' | 'fail';
  version: string;
}

interface ShlinkTagsStats {
  tag: string;
  shortUrlsCount: number;
  visitsCount: number;
}

export interface ShlinkTags {
  tags: string[];
  stats?: ShlinkTagsStats[];
}

export interface ProblemDetailsError {
  type: string;
  detail: string;
  title: string;
  status: number;
  error?: string; // Deprecated
  message?: string; // Deprecated
  [extraProps: string]: any;
}
