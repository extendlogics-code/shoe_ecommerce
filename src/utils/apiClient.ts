const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/u, "");

const buildUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  if (typeof input !== "string") {
    return input;
  }

  if (!normalizedBaseUrl) {
    return input;
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  const separator = input.startsWith("/") ? "" : "/";
  return `${normalizedBaseUrl}${separator}${input}`;
};

export const apiFetch: typeof fetch = (input, init) => {
  const url = buildUrl(input);
  return fetch(url, init);
};

export const getApiBaseUrl = () => normalizedBaseUrl;
