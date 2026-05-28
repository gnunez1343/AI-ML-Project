"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { BadgeVariant } from "@/components/ui/Badge";
import type { TherapySession } from "@/types/session";

const MOCK_SESSIONS: TherapySession[] = [];

const STATUS_VARIANT: Record<TherapySession["status"], BadgeVariant> = {
  recording: "error",
  processing: "warning",
  draft: "info",
  approved: "success",
};

const STATUS_LABEL: Record<TherapySession["status"], string> = {
  recording: "Recording",
  processing: "Processing",
  draft: "Draft",
  approved: "Approved",
};

export default function SessionsPage() {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Past Sessions</h1>
        <Button size="sm" onClick={() => router.push("/dashboard/sessions/new")}>
          <Mic size={14} />
          New Session
        </Button>
      </div>

      {MOCK_SESSIONS.length > 0 ? (
        <Card>
          <div className="divide-y divide-warm-100">
            {MOCK_SESSIONS.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 px-4 hover:bg-warm-50 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{s.patientName}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {new Date(s.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    &middot; {s.duration} min
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mb-4">
            <Mic size={28} className="text-sage-600" />
          </div>
          <h2 className="text-base font-semibold text-ink-900 mb-1">No sessions yet</h2>
          <p className="text-sm text-ink-400 max-w-xs mb-6">
            Your recorded sessions will appear here once you start one.
          </p>
          <Button size="lg" onClick={() => router.push("/dashboard/sessions/new")}>
            Start Session
          </Button>
        </div>
      )}
    </div>
  );
}
