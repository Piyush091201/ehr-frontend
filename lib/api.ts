const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";
const TOKEN_KEY = "ehr_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Field-level validation errors, normalised to lowercase field keys. */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;
  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handle401(status: number) {
  if (status === 401 && typeof window !== "undefined") {
    clearToken();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

async function buildError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  const fieldErrors: FieldErrors = {};
  try {
    const data = await res.json();
    // ASP.NET Core ValidationProblemDetails: { title, errors: { Field: [msg] } }
    if (data.errors && typeof data.errors === "object") {
      for (const [key, val] of Object.entries(data.errors)) {
        fieldErrors[key.charAt(0).toLowerCase() + key.slice(1)] = val as string[];
      }
      const first = Object.values(fieldErrors)[0]?.[0];
      message = first ?? "Please correct the highlighted fields.";
    } else {
      message = data.message ?? data.title ?? message;
    }
  } catch {
    /* non-JSON body */
  }
  return new ApiError(res.status, message, fieldErrors);
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, authHeader());

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  handle401(res.status);
  if (!res.ok) throw await buildError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Download a file (e.g. invoice PDF) through the authenticated API. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeader(), cache: "no-store" });
  handle401(res.status);
  if (!res.ok) throw await buildError(res);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
