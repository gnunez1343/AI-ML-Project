/**
 * API client — talks to FastAPI backend, sending cookies for auth.
 */

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = BACKEND + path;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = "HTTP " + res.status;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ── Sessions ───────────────────────────────────────────────────────────────

import type {
  SessionDetail,
  SessionListItem,
  SessionType,
} from "@/types/session";

export const sessionsApi = {
  create(patientName: string, sessionType: SessionType): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_name: patientName, session_type: sessionType }),
    });
  },

  list(): Promise<SessionListItem[]> {
    return request<SessionListItem[]>("/api/sessions");
  },

  get(sessionId: string): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions/" + sessionId);
  },

  uploadAudio(
    sessionId: string,
    file: Blob,
    filename: string,
    durationSeconds?: number,
    onProgress?: (pct: number) => void
  ): Promise<SessionDetail> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file, filename);
      if (durationSeconds != null) {
        form.append("duration_seconds", String(Math.round(durationSeconds)));
      }

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as SessionDetail);
          } catch {
            reject(new ApiError(xhr.status, "Invalid JSON response"));
          }
        } else {
          let message = "HTTP " + xhr.status;
          try {
            message = JSON.parse(xhr.responseText)?.detail ?? message;
          } catch {
            // ignore
          }
          reject(new ApiError(xhr.status, message));
        }
      });

      xhr.addEventListener("error", () =>
        reject(new ApiError(0, "Network error during upload"))
      );

      xhr.open("POST", BACKEND + "/api/sessions/" + sessionId + "/upload");
      xhr.send(form);
    });
  },

  transcribe(sessionId: string): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions/" + sessionId + "/transcribe", {
      method: "POST",
    });
  },

  generateNote(sessionId: string): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions/" + sessionId + "/generate-note", {
      method: "POST",
    });
  },

  updateNote(
    sessionId: string,
    fields: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }
  ): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions/" + sessionId + "/note", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  },

  approve(sessionId: string): Promise<SessionDetail> {
    return request<SessionDetail>("/api/sessions/" + sessionId + "/approve", {
      method: "POST",
    });
  },
};
