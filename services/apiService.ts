/** In production, set VITE_API_URL to your backend base URL including /api (e.g. https://api.factpro.benmalekprod.com/api) */
const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
export const API_URL = "http://192.168.1.35:6060/api";

export type ApiErrorKind = "NETWORK" | "HTTP" | "UNKNOWN";

export type ApiErrorPayload = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
};

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.kind = payload.kind;
    this.status = payload.status;
  }
}

const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem("factupro_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: user.token ? `Bearer ${user.token}` : "",
  };
};

const fallbackMessageForStatus = (status: number) => {
  if (status === 400) return "Requête invalide.";
  if (status === 401) return "Session expirée. Veuillez vous reconnecter.";
  if (status === 403) return "Accès refusé.";
  if (status === 404) return "Ressource introuvable.";
  if (status >= 500) return "Erreur serveur. Réessayez dans quelques instants.";
  return "Une erreur est survenue.";
};

const parseResponseBody = async (res: Response) => {
  const text = await res.text();
  if (!text) return { rawText: "", json: null as any };
  try {
    return { rawText: text, json: JSON.parse(text) };
  } catch {
    return { rawText: text, json: null as any };
  }
};

const toApiErrorPayload = (err: unknown): ApiErrorPayload => {
  if (err instanceof ApiError)
    return { kind: err.kind, status: err.status, message: err.message };
  if (err instanceof Error) return { kind: "UNKNOWN", message: err.message };
  return { kind: "UNKNOWN", message: "Une erreur est survenue." };
};

async function request(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  data?: any,
) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: getHeaders(),
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  } catch {
    throw new ApiError({
      kind: "NETWORK",
      message: "Impossible de joindre le serveur. Vérifiez votre connexion.",
    });
  }

  const { rawText, json } = await parseResponseBody(res);

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) ||
      rawText ||
      fallbackMessageForStatus(res.status);
    throw new ApiError({ kind: "HTTP", status: res.status, message });
  }

  return json ?? (rawText as any);
}

export const apiService = {
  async get(endpoint: string) {
    return request("GET", endpoint);
  },
  async post(endpoint: string, data: any) {
    return request("POST", endpoint, data);
  },
  async put(endpoint: string, data: any) {
    return request("PUT", endpoint, data);
  },
  async delete(endpoint: string) {
    return request("DELETE", endpoint);
  },
  toApiErrorPayload,
};

export const checkBackendAlive = async (): Promise<boolean> => {
  try {
    // We only care that the server is reachable at all, not about the HTTP status.
    await fetch(API_URL, { method: "GET" });
    return true;
  } catch {
    return false;
  }
};
