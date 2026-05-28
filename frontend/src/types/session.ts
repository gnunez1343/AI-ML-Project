export type SessionStatus = "recording" | "processing" | "draft" | "approved";

export interface TherapySession {
  id: string;
  patientName: string;
  date: string;
  duration: number; // minutes
  status: SessionStatus;
  notePreview?: string;
}
