"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { sessionsApi } from "@/lib/api";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { SessionListItem, SessionStatus } from "@/types/session";

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

const SESSION_TYPE_LABEL: Record<string, string> = {
  individual: "Individual",
  couples:    "Couples",
  family:     "Family",
  group:      "Group",
  intake:     "Intake",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  return m > 0 ? m + " min" : seconds + "s";
}

export default function DashboardPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await sessionsApi.list();
        if (!cancelled) setSessions(data);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load sessions:", err);
          setError("Failed to load sessions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const hasSessions = sessions.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Sessions</h1>
        <Button size="sm" onClick={() => router.push("/dashboard/sessions/new")}>
          <Mic size={14} />
          New Session
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-sage-200 border-t-sage-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-risk-critical mb-3">{error}</p>
          <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : hasSessions ? (
        <Card>
          <div className="divide-y divide-warm-100">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push("/dashboard/sessions/" + s.id)}
                className="flex items-center gap-3 py-3 px-4 hover:bg-warm-50 rounded-md cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <Avatar initials={getInitials(s.patient_name)} size="sm" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {s.patient_name}
                  </p>
                  <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{SESSION_TYPE_LABEL[s.session_type] ?? s.session_type}</span>
                    <span>·</span>
                    <span>{formatDate(s.created_at)}</span>
                    <span>·</span>
                    <span>{formatTime(s.created_at)}</span>
                    {s.duration_seconds && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatDuration(s.duration_seconds)}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <Badge variant={STATUS_VARIANT[s.status]}>
                  {STATUS_LABEL[s.status]}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mb-4">
            <Mic size={28} className="text-sage-600" />
          </div>
          <h2 className="text-base font-semibold text-ink-900 mb-1">
            Record Your First Session
          </h2>
          <p className="text-sm text-ink-400 max-w-xs mb-6">
            Start a session to see AI-generated notes appear here.
          </p>
          <Button size="lg" onClick={() => router.push("/dashboard/sessions/new")}>
            Start Session
          </Button>
        </div>
      )}
    </div>
  );
}
