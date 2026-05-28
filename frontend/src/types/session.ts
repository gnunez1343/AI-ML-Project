export type SessionStatus = "recording" | "processing" | "draft" | "approved";
export type SessionType = "individual" | "couples" | "family" | "group" | "intake";

// Legacy interface used in original scaffold
export interface TherapySession {
  id: string;
  patientName: string;
  date: string;
  duration: number; // minutes
  status: SessionStatus;
  notePreview?: string;
}

// API response types — mirror backend schemas

export interface TranscriptSegment {
  speaker: "therapist" | "patient";
  text: string;
  start: number;
  end: number;
}

export interface TranscriptData {
  id: string;
  segments: TranscriptSegment[];
  raw_text: string;
}

export interface NoteData {
  id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: "draft" | "approved";
  approved_at: string | null;
}

export interface PatientData {
  id: string;
  name: string;
}

export interface SessionDetail {
  id: string;
  patient: PatientData;
  session_type: SessionType;
  status: SessionStatus;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  transcript: TranscriptData | null;
  note: NoteData | null;
}

export interface SessionListItem {
  id: string;
  patient_name: string;
  session_type: SessionType;
  status: SessionStatus;
  duration_seconds: number | null;
  created_at: string;
  has_note: boolean;
}
