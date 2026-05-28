"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  CheckCheck,
  Edit3,
  Eye,
  ThumbsUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sessionsApi, ApiError } from "@/lib/api";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { SessionDetail, SessionStatus, TranscriptSegment } from "@/types/session";

const STATUS_VARIANT: Record<SessionStatus, BadgeVariant> = {
  recording:  "error",
  processing: "warning",
  draft:      "info",
  approved:   "success",
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  recording:  "Recording",
  processing: "Processing",
  draft:      "Draft",
  approved:   "Approved",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return s + "s";
  return m + "m " + (s > 0 ? s + "s" : "");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

// ── SOAP section ─────────────────────────────────────────────────────────────

interface SoapSectionProps {
  title: string;
  field: "subjective" | "objective" | "assessment" | "plan";
  value: string;
  isEditing: boolean;
  onChange: (field: "subjective" | "objective" | "assessment" | "plan", value: string) => void;
}

function SoapSection({ title, field, value, isEditing, onChange }: SoapSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-warm-200 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-warm-50 hover:bg-warm-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-ink-900">{title}</span>
        {open ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
      </button>
      {open && (
        <div className="px-4 py-3">
          {isEditing ? (
            <textarea
              value={value}
              onChange={(e) => onChange(field, e.target.value)}
              rows={8}
              className="w-full text-sm text-ink-900 bg-white border border-warm-200 rounded-md px-3 py-2 resize-vertical focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 leading-relaxed"
            />
          ) : (
            <p className="text-sm text-ink-900 whitespace-pre-wrap leading-relaxed">
              {value || <span className="text-ink-400 italic">No content yet</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Transcript panel ──────────────────────────────────────────────────────────

function TranscriptPanel({ segments }: { segments: TranscriptSegment[] }) {
  if (!segments.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center px-4">
        <p className="text-sm text-ink-400">No transcript available</p>
        <p className="text-xs text-ink-400 mt-1">Transcript will appear here after transcription</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto flex-1">
      {segments.map((seg, idx) => {
        const isTherapist = seg.speaker === "therapist";
        return (
          <div key={idx} className="flex gap-3">
            <div className="shrink-0 w-20 text-right">
              <span className="text-xs font-medium text-ink-400">
                {formatTimestamp(seg.start)}
              </span>
            </div>
            <div className="flex-1">
              <span
                className={[
                  "inline-block text-xs font-semibold mb-1 px-1.5 py-0.5 rounded",
                  isTherapist
                    ? "bg-sage-100 text-sage-900"
                    : "bg-surface-info text-risk-low",
                ].join(" ")}
              >
                {isTherapist ? "Therapist" : "Patient"}
              </span>
              <p className="text-sm text-ink-900 leading-relaxed">{seg.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note editing
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Approve
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [approving, setApproving] = useState(false);
  const noteScrollRef = useRef<HTMLDivElement>(null);

  // Copy to clipboard
  const [copied, setCopied] = useState(false);

  // ── Load session ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await sessionsApi.get(sessionId);
        if (cancelled) return;
        setSession(data);
        if (data.note) {
          setEditDraft({
            subjective: data.note.subjective,
            objective: data.note.objective,
            assessment: data.note.assessment,
            plan: data.note.plan,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : "Failed to load session";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Poll if processing
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const data = await sessionsApi.get(sessionId);
        if (cancelled) return;
        setSession(data);
        if (data.note && !isEditing) {
          setEditDraft({
            subjective: data.note.subjective,
            objective: data.note.objective,
            assessment: data.note.assessment,
            plan: data.note.plan,
          });
        }
        if (data.status === "draft" || data.status === "approved") {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  // ── Scroll detection for approve gate ──────────────────────────────────────
  const handleNoteScroll = useCallback(() => {
    const el = noteScrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  // ── Edit handlers ──────────────────────────────────────────────────────────
  function handleFieldChange(field: keyof typeof editDraft, value: string) {
    setEditDraft((d) => ({ ...d, [field]: value }));
  }

  async function saveNote() {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await sessionsApi.updateNote(session.id, editDraft);
      setSession(updated);
      setIsEditing(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save note";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (session?.note) {
      setEditDraft({
        subjective: session.note.subjective,
        objective: session.note.objective,
        assessment: session.note.assessment,
        plan: session.note.plan,
      });
    }
    setIsEditing(false);
    setSaveError(null);
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  async function handleApprove() {
    if (!session) return;
    setApproving(true);
    try {
      const updated = await sessionsApi.approve(session.id);
      setSession(updated);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to approve note";
      setSaveError(msg);
    } finally {
      setApproving(false);
    }
  }

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  function copyNote() {
    if (!session?.note) return;
    const { subjective, objective, assessment, plan } = session.note;
    const text = [
      "SOAP NOTE",
      "=========",
      "",
      "SUBJECTIVE",
      "----------",
      subjective,
      "",
      "OBJECTIVE",
      "---------",
      objective,
      "",
      "ASSESSMENT",
      "----------",
      assessment,
      "",
      "PLAN",
      "----",
      plan,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-sage-200 border-t-sage-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <AlertCircle size={36} className="text-risk-critical" />
        <p className="text-sm font-medium text-ink-900">{error ?? "Session not found"}</p>
        <Button size="sm" variant="secondary" onClick={() => router.push("/dashboard")}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  const isProcessing = session.status === "processing" || session.status === "recording";
  const hasNote = !!session.note;
  const isApproved = session.note?.status === "approved";
  const noteFields = isEditing ? editDraft : {
    subjective: session.note?.subjective ?? "",
    objective:  session.note?.objective  ?? "",
    assessment: session.note?.assessment ?? "",
    plan:       session.note?.plan       ?? "",
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 7rem)" }}>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-ink-400 hover:text-ink-900 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-ink-900 leading-tight">
              {session.patient.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-ink-400 capitalize">{session.session_type} therapy</span>
              <span className="text-xs text-ink-400">·</span>
              <span className="text-xs text-ink-400">{formatDate(session.created_at)}</span>
              <span className="text-xs text-ink-400">at</span>
              <span className="text-xs text-ink-400">{formatTime(session.created_at)}</span>
              {session.duration_seconds && (
                <>
                  <span className="text-xs text-ink-400">·</span>
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <Clock size={11} />
                    {formatDuration(session.duration_seconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[session.status]}>
          {STATUS_LABEL[session.status]}
        </Badge>
      </div>

      {/* ── Processing state ─────────────────────────────────────────────────── */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-sage-200 border-t-sage-600" />
          <p className="text-sm font-medium text-ink-900">Processing session…</p>
          <p className="text-xs text-ink-400">Transcribing audio and generating your SOAP note</p>
        </div>
      )}

      {/* ── Split-view ──────────────────────────────────────────────────────── */}
      {!isProcessing && (
        <div className="flex gap-4 flex-1 overflow-hidden min-h-0" style={{ height: "calc(100vh - 14rem)" }}>
          {/* LEFT — Transcript */}
          <div className="flex flex-col w-1/2 bg-white border border-warm-200 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-200 shrink-0">
              <h2 className="text-sm font-semibold text-ink-900">Transcript</h2>
              {session.transcript && (
                <p className="text-xs text-ink-400 mt-0.5">
                  {session.transcript.segments.length} utterances
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TranscriptPanel segments={session.transcript?.segments ?? []} />
            </div>
          </div>

          {/* RIGHT — SOAP note */}
          <div className="flex flex-col w-1/2 bg-white border border-warm-200 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-200 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">SOAP Note</h2>
                {isApproved && session.note?.approved_at && (
                  <p className="text-xs text-sage-700 mt-0.5">
                    Approved {formatDate(session.note.approved_at)}
                  </p>
                )}
              </div>
              {hasNote && !isApproved && (
                <button
                  onClick={() => isEditing ? cancelEdit() : setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-600 hover:text-ink-900 transition-colors"
                >
                  {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
                  {isEditing ? "Preview" : "Edit"}
                </button>
              )}
            </div>

            <div
              ref={noteScrollRef}
              onScroll={handleNoteScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {!hasNote ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-sm text-ink-400">No note generated yet</p>
                  <p className="text-xs text-ink-400 mt-1">Note will appear here once processing completes</p>
                </div>
              ) : (
                <>
                  <SoapSection title="S — Subjective"  field="subjective" value={noteFields.subjective} isEditing={isEditing} onChange={handleFieldChange} />
                  <SoapSection title="O — Objective"   field="objective"  value={noteFields.objective}  isEditing={isEditing} onChange={handleFieldChange} />
                  <SoapSection title="A — Assessment"  field="assessment" value={noteFields.assessment} isEditing={isEditing} onChange={handleFieldChange} />
                  <SoapSection title="P — Plan"        field="plan"       value={noteFields.plan}       isEditing={isEditing} onChange={handleFieldChange} />
                </>
              )}
            </div>

            {/* Error */}
            {saveError && (
              <div className="px-4 py-2 bg-surface-critical border-t border-warm-200">
                <p className="text-xs text-risk-critical">{saveError}</p>
              </div>
            )}

            {/* Bottom action bar */}
            {hasNote && (
              <div className="px-4 py-3 border-t border-warm-200 shrink-0 flex items-center gap-2 flex-wrap">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={saveNote} isLoading={saving}>
                      Save Changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyNote}
                      className="gap-1.5"
                    >
                      {copied ? <CheckCheck size={14} className="text-sage-600" /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </Button>

                    {!isApproved && (
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        isLoading={approving}
                        disabled={!scrolledToBottom || approving}
                        title={!scrolledToBottom ? "Scroll to the bottom of the note to approve" : undefined}
                      >
                        <ThumbsUp size={14} />
                        Approve Note
                      </Button>
                    )}

                    {!isApproved && !scrolledToBottom && (
                      <p className="text-xs text-ink-400 w-full mt-1">
                        Scroll to the bottom of the note to enable approval
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
