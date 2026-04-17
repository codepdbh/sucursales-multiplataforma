const TOKEN_STORAGE_KEY = 'inventory_access_token';
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3012/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryParams = Record<string, QueryValue>;

function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function buildQuery(params?: QueryParams): string {
  if (!params) {
    return '';
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    query.append(key, String(value));
  });

  const asString = query.toString();
  return asString ? `?${asString}` : '';
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(', ');
    }

    if (payload.message) {
      return payload.message;
    }
  } catch {
    // Fallback below.
  }

  return `Error HTTP ${response.status}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  isMultipart?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers();

  if (!options.isMultipart) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(
    `${API_BASE_URL}${path}${buildQuery(options.query)}`,
    {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : options.isMultipart
            ? (options.body as BodyInit)
            : JSON.stringify(options.body),
    },
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
