"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { sessionsApi, ApiError } from "@/lib/api";
import type { SessionType } from "@/types/session";

type PageState =
  | "form"        // patient name + session type form
  | "ready"       // form filled, ready to record
  | "recording"   // actively recording
  | "uploading"   // uploading to backend
  | "transcribing"
  | "generating"
  | "done"
  | "error";

const SESSION_TYPE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "couples",    label: "Couples" },
  { value: "family",     label: "Family" },
  { value: "group",      label: "Group" },
  { value: "intake",     label: "Intake" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

function WaveformBars({ active }: { active: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="flex items-center gap-0.5 h-10">
      {bars.map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-sage-600 transition-all"
          style={{
            height: active ? Math.random() * 100 + "%" : "20%",
            animation: active ? "waveBar 0.6s ease-in-out infinite alternate" : "none",
            animationDelay: i * 0.04 + "s",
          }}
        />
      ))}
    </div>
  );
}

export default function NewSessionPage() {
  const router = useRouter();

  const [patientName, setPatientName] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("individual");
  const [pageState, setPageState] = useState<PageState>("form");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recording state
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [waveActive, setWaveActive] = useState(false);

  // Animate waveform
  useEffect(() => {
    if (pageState === "recording") {
      waveTimerRef.current = setInterval(() => setWaveActive((v) => !v), 500);
    } else {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
      setWaveActive(false);
    }
    return () => {
      if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    };
  }, [pageState]);

  // Timer
  useEffect(() => {
    if (pageState === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pageState]);

  const canProceed = patientName.trim().length > 0;

  const startRecording = useCallback(async () => {
    if (!canProceed) return;
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(500);
      setPageState("recording");
      setRecordingSeconds(0);
    } catch (err) {
      setErrorMsg("Microphone access denied. Please allow microphone access and try again.");
      console.error(err);
    }
  }, [canProceed]);

  const stopRecordingAndProcess = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    const duration = recordingSeconds;

    // Stop all tracks
    recorder.stream.getTracks().forEach((t) => t.stop());

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        resolve(new Blob(audioChunksRef.current, { type: mimeType }));
      };
      recorder.stop();
    });

    await processAudio(blob, duration);
  }, [recordingSeconds]);

  const processAudio = useCallback(async (audioBlob: Blob, durationSecs: number) => {
    setErrorMsg(null);

    try {
      // 1. Create session
      setPageState("uploading");
      const created = await sessionsApi.create(patientName.trim(), sessionType);
      const sid = created.id;
      setSessionId(sid);

      // 2. Upload audio
      const ext = audioBlob.type.includes("mp4") ? "m4a"
        : audioBlob.type.includes("mpeg") ? "mp3"
        : "webm";
      await sessionsApi.uploadAudio(
        sid,
        audioBlob,
        "session." + ext,
        durationSecs,
        (pct) => setUploadProgress(pct)
      );

      // 3. Transcribe
      setPageState("transcribing");
      await sessionsApi.transcribe(sid);

      // 4. Generate note
      setPageState("generating");
      await sessionsApi.generateNote(sid);

      setPageState("done");
      setTimeout(() => router.push("/dashboard/sessions/" + sid), 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "An unexpected error occurred";
      setErrorMsg(msg);
      setPageState("error");
    }
  }, [patientName, sessionType, router]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canProceed) return;
    e.target.value = "";
    await processAudio(file, 0);
  }, [canProceed, processAudio]);

  // ----- Render -----

  const isProcessing = ["uploading", "transcribing", "generating"].includes(pageState);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New Session</h1>
        <p className="text-sm text-ink-400 mt-1">Record audio or upload a file to generate a SOAP note.</p>
      </div>

      <style>{`
        @keyframes waveBar {
          from { height: 20%; }
          to   { height: 100%; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70%  { box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>

      <Card className="p-6 space-y-5">
        {/* Patient name */}
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            Patient Name
          </label>
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            disabled={isProcessing || pageState === "recording" || pageState === "done"}
          />
        </div>

        {/* Session type */}
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            Session Type
          </label>
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as SessionType)}
            disabled={isProcessing || pageState === "recording" || pageState === "done"}
            className="w-full h-9 px-3 text-sm rounded-md border border-warm-200 bg-white text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Recording UI */}
        <div className="flex flex-col items-center gap-4 pt-2">
          {pageState === "form" || pageState === "ready" ? (
            <>
              {/* Large record button */}
              <button
                onClick={startRecording}
                disabled={!canProceed}
                className="w-20 h-20 rounded-full bg-sage-600 hover:bg-sage-700 active:bg-sage-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-colors"
                aria-label="Start recording"
              >
                <Mic size={32} className="text-white" />
              </button>
              <p className="text-sm text-ink-400">
                {canProceed ? "Tap to start recording" : "Enter patient name to begin"}
              </p>

              {/* Upload alternative */}
              <div className="w-full border-t border-warm-200 pt-4 flex flex-col items-center gap-2">
                <p className="text-xs text-ink-400">Or upload a pre-recorded file</p>
                <label
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-md border border-warm-200 text-sm text-ink-600 cursor-pointer",
                    "hover:bg-warm-50 transition-colors",
                    !canProceed ? "opacity-40 cursor-not-allowed pointer-events-none" : "",
                  ].join(" ")}
                >
                  <Upload size={16} />
                  Upload Audio (WAV/MP3/M4A)
                  <input
                    type="file"
                    accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={!canProceed}
                  />
                </label>
              </div>
            </>
          ) : pageState === "recording" ? (
            <>
              <WaveformBars active={true} />

              <div className="text-2xl font-mono font-semibold text-ink-900">
                {formatTime(recordingSeconds)}
              </div>

              <button
                onClick={stopRecordingAndProcess}
                className="w-20 h-20 rounded-full bg-risk-critical hover:bg-red-700 flex items-center justify-center shadow-md transition-colors"
                style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
                aria-label="Stop recording"
              >
                <MicOff size={28} className="text-white" />
              </button>
              <p className="text-sm text-ink-400">Tap to stop and generate note</p>
            </>
          ) : pageState === "uploading" ? (
            <div className="w-full space-y-3 py-4">
              <p className="text-sm font-medium text-ink-900 text-center">Uploading audio…</p>
              <div className="w-full bg-warm-200 rounded-full h-2">
                <div
                  className="bg-sage-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: uploadProgress + "%" }}
                />
              </div>
              <p className="text-xs text-ink-400 text-center">{uploadProgress}%</p>
            </div>
          ) : pageState === "transcribing" ? (
            <ProcessingStep icon="🎙️" label="Transcribing audio…" sub="Identifying speakers and extracting dialogue" />
          ) : pageState === "generating" ? (
            <ProcessingStep icon="🧠" label="Generating SOAP note…" sub="Analyzing transcript with clinical AI" />
          ) : pageState === "done" ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={48} className="text-sage-600" />
              <p className="text-base font-semibold text-ink-900">Note ready!</p>
              <p className="text-sm text-ink-400">Redirecting to note review…</p>
            </div>
          ) : pageState === "error" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle size={40} className="text-risk-critical" />
              <p className="text-sm font-medium text-ink-900">Something went wrong</p>
              {errorMsg && <p className="text-xs text-ink-400 max-w-xs">{errorMsg}</p>}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPageState("form");
                  setErrorMsg(null);
                  setUploadProgress(0);
                }}
              >
                Try Again
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Back */}
      {!isProcessing && pageState !== "recording" && pageState !== "done" && (
        <div className="mt-4 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-ink-400 hover:text-ink-600 transition-colors"
          >
            ← Back to Sessions
          </button>
        </div>
      )}
    </div>
  );
}

function ProcessingStep({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="text-4xl animate-pulse">{icon}</div>
      <p className="text-base font-semibold text-ink-900">{label}</p>
      <p className="text-sm text-ink-400">{sub}</p>
    </div>
  );
}
