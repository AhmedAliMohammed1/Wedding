const SERVICE_NOT_CONNECTED =
  'The guest-notes service is not connected on this deployment. Please redeploy the complete Netlify project, not only the dist folder.';
const SERVICE_UNAVAILABLE = 'The guest-notes service is temporarily unavailable. Please try again in a moment.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const extractErrorText = (value: unknown, depth = 0): string => {
  if (depth > 3) return '';

  if (typeof value === 'string') {
    const text = value.trim();
    return text && text !== '[object Object]' ? text : '';
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = extractErrorText(item, depth + 1);
      if (text) return text;
    }
    return '';
  }

  if (!isRecord(value)) return '';

  for (const key of ['message', 'error', 'detail', 'title', 'errors']) {
    const text = extractErrorText(value[key], depth + 1);
    if (text) return text;
  }

  return '';
};

const statusMessage = (status: number, fallback: string) => {
  if (status === 404 || status === 405) return SERVICE_NOT_CONNECTED;
  if (status === 401 || status === 403) {
    return 'The guest-notes service is blocked by this site’s access settings.';
  }
  if (status === 429) return 'Too many notes were sent at once. Please wait a minute and try again.';
  if (status >= 500) return SERVICE_UNAVAILABLE;
  return fallback;
};

const parseBody = (rawBody: string): unknown => {
  if (!rawBody) return null;

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
};

const looksLikeHtml = (value: unknown) =>
  typeof value === 'string' && /<(?:!doctype|html|head|body)\b/i.test(value);

export const readNotesApiResponse = async <T,>(response: Response, fallback: string): Promise<T> => {
  let rawBody = '';

  try {
    rawBody = await response.text();
  } catch {
    throw new Error(response.ok ? fallback : statusMessage(response.status, fallback));
  }

  const data = parseBody(rawBody);

  if (!response.ok) {
    const nestedMessage = extractErrorText(data);
    const message = statusMessage(response.status, nestedMessage || fallback);
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (
    data === null ||
    looksLikeHtml(data) ||
    (!contentType.includes('application/json') && typeof data === 'string')
  ) {
    throw new Error(SERVICE_NOT_CONNECTED);
  }

  return data as T;
};

