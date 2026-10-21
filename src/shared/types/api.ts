export type ApiEnvelope<T> = {
  status: number;
  message: string;
  data: T;
  errorCode?: string;
  path?: string;
  timestamp?: string;
};

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};
