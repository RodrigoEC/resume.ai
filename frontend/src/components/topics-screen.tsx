/*
  Topics screen (T-1 … T-6). Build-the-knowledge-base loop:
  upload or record audio -> run transcription -> review AI-drafted STAR topics ->
  edit/remove -> save to the database.

  Notable spec behaviours implemented here:
  - T-1: accept mp3/m4a/wav/webm, inline error for unsupported, per-file remove.
  - T-2: in-browser recording via MediaRecorder, elapsed timer, appears in the list.
  - T-3: one action processes all files with per-file status.
  - T-4/T-5: STAR cards with all five fields editable; remove offers 5s undo; on
    mobile only the first draft is expanded, the rest collapse to title + expand.
  - T-6: Save stores remaining drafts and reports a count.
*/
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CountBadge,
  FooterHint,
  IconButton,
  PageTitle,
  TextArea,
} from "@/components/ui";
import {
  ChevronDownIcon,
  CloseIcon,
  EditIcon,
  MicIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/icons";
import { draftTopicsForFiles, newId, saveTopics } from "@/lib/store";
import type { Topic } from "@/lib/types";

const ACCEPTED = [".mp3", ".m4a", ".wav", ".webm"];
const ACCEPTED_MIME = /audio\/(mpeg|mp3|m4a|x-m4a|wav|x-wav|webm)/;

interface AudioFile {
  id: string;
  name: string;
  durationS: number | null;
  status: "ready" | "queued" | "transcribing" | "structuring" | "done" | "failed";
}

function fmtDuration(s: number | null): string {
  if (s == null) return "";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<AudioFile["status"], string> = {
  ready: "ready",
  queued: "queued",
  transcribing: "transcribing…",
  structuring: "structuring…",
  done: "done",
  failed: "failed",
};

export function TopicsScreen() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [drafts, setDrafts] = useState<Topic[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [undo, setUndo] = useState<{ topic: Topic; index: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: AudioFile[] = [];
    for (const f of Array.from(list)) {
      const okExt = ACCEPTED.some((e) => f.name.toLowerCase().endsWith(e));
      const okMime = ACCEPTED_MIME.test(f.type);
      if (!okExt && !okMime) {
        setError(`"${f.name}" is not a supported audio file (mp3, m4a, wav, webm).`);
        continue;
      }
      next.push({
        id: newId("rec"),
        name: f.name,
        durationS: null,
        status: "ready",
      });
    }
    if (next.length) {
      setError(null);
      setFiles((prev) => [...prev, ...next]);
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function runTranscription() {
    if (!files.length) return;
    setProcessing(true);
    setSavedCount(null);
    // T-3: walk each file through queued -> transcribing -> structuring -> done.
    setFiles((prev) => prev.map((f) => ({ ...f, status: "queued" })));
    for (const stage of ["transcribing", "structuring", "done"] as const) {
      await new Promise((r) => setTimeout(r, 500));
      setFiles((prev) => prev.map((f) => ({ ...f, status: stage })));
    }
    const produced = await draftTopicsForFiles(
      files.map((f) => ({ id: f.id, fileName: f.name })),
    );
    setDrafts((prev) => [...prev, ...produced]);
    setExpandedId((cur) => cur ?? produced[0]?.id ?? null);
    setProcessing(false);
  }

  function patchDraft(id: string, patch: Partial<Topic>) {
    setDrafts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeDraft(id: string) {
    // T-5: no confirmation, but offer a 5s undo.
    const index = drafts.findIndex((t) => t.id === id);
    const topic = drafts[index];
    if (!topic) return;
    setDrafts((prev) => prev.filter((t) => t.id !== id));
    setUndo({ topic, index });
  }

  async function handleSave() {
    if (!drafts.length) return;
    setSaving(true);
    const count = await saveTopics(drafts);
    setDrafts([]);
    setSavedCount(count);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageTitle>Your experiences</PageTitle>
        <p className="mt-3 max-w-xl text-muted">
          Record yourself talking about past roles and projects. We transcribe
          each recording and draft STAR topics for you to review.
        </p>
      </div>

      {/* Upload / record area (T-1, T-2) */}
      <UploadArea
        onBrowse={() => inputRef.current?.click()}
        onFiles={addFiles}
        onRecorded={(name, durationS) =>
          setFiles((prev) => [
            ...prev,
            { id: newId("rec"), name, durationS, status: "ready" },
          ])
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-orange">
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-3">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-[var(--radius-sketch)] border border-ink bg-surface px-4 py-3"
            >
              <MicIcon className="shrink-0 text-olive" />
              <span className="min-w-0 flex-1 truncate font-bold">
                {f.name}{" "}
                {f.durationS != null && (
                  <span className="font-normal text-muted">
                    {fmtDuration(f.durationS)}
                  </span>
                )}
              </span>
              <span
                className={`text-sm ${
                  f.status === "failed"
                    ? "text-orange"
                    : f.status === "done"
                      ? "text-olive"
                      : "text-muted"
                }`}
              >
                {f.status !== "ready" && STATUS_LABEL[f.status]}
              </span>
              <IconButton
                label={`Remove ${f.name}`}
                tone="danger"
                className="h-9 w-9"
                onClick={() => removeFile(f.id)}
              >
                <CloseIcon width={16} height={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <div className="flex justify-center">
          <Button onClick={runTranscription} disabled={processing}>
            {processing ? "transcribing…" : "run transcription"}
          </Button>
        </div>
      )}

      {/* Suggested topics (T-4, T-5) */}
      {(drafts.length > 0 || savedCount != null) && (
        <div className="flex flex-col gap-5 border-t border-dashed border-ink/40 pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="highlight text-2xl font-bold">Suggested topics</h2>
              <p className="mt-2 max-w-xl text-muted">
                Drafted by AI from your transcripts. Edit or remove anything, then
                save the topics to your experience database.
              </p>
            </div>
            {drafts.length > 0 && (
              <CountBadge>
                {drafts.length} draft{drafts.length === 1 ? "" : "s"}
              </CountBadge>
            )}
          </div>

          {savedCount != null && (
            <p role="status" className="text-olive">
              Saved {savedCount} topic{savedCount === 1 ? "" : "s"} to your
              database.
            </p>
          )}

          {drafts.map((t, i) => (
            <StarCard
              key={t.id}
              topic={t}
              index={i}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
              onPatch={patchDraft}
              onRemove={removeDraft}
            />
          ))}

          {drafts.length > 0 && (
            <div className="flex flex-col items-end gap-3 border-t border-dashed border-ink/40 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <FooterHint>
                saved topics are used to match you to job descriptions
              </FooterHint>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "saving…" : "Save"}
              </Button>
            </div>
          )}
        </div>
      )}

      {undo && (
        <UndoToast
          onUndo={() => {
            setDrafts((prev) => {
              const copy = [...prev];
              copy.splice(undo.index, 0, undo.topic);
              return copy;
            });
            setUndo(null);
          }}
          onExpire={() => setUndo(null)}
        />
      )}
    </div>
  );
}

function UploadArea({
  onBrowse,
  onFiles,
  onRecorded,
}: {
  onBrowse: () => void;
  onFiles: (list: FileList | null) => void;
  onRecorded: (name: string, durationS: number | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      const startedAt = Date.now();
      rec.onstop = () => {
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        setElapsed(0);
        onRecorded(`recording-${new Date().toISOString().slice(11, 19)}.webm`, seconds);
      };
      rec.start();
      setRecording(true);
      timerRef.current = setInterval(
        () => setElapsed((e) => e + 1),
        1000,
      );
    } catch {
      // Permission denied or no mic — stay silent in the UI dropzone; browse still works.
      setRecording(false);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center gap-4 rounded-[var(--radius-sketch)] border-2 border-dashed p-8 text-center transition-colors ${
        dragging ? "border-olive bg-sage/20" : "border-olive/60 bg-sage-tint"
      }`}
    >
      {/* Mobile-first "tap to record" is the primary affordance on phones (T-2) */}
      <button
        onClick={toggleRecord}
        className="group flex flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-olive sm:hidden"
        aria-pressed={recording}
      >
        <span
          className={`flex h-20 w-20 items-center justify-center rounded-full border border-ink ${
            recording ? "animate-pulse bg-orange/80" : "bg-sage"
          }`}
        >
          <MicIcon width={30} height={30} className="text-ink" />
        </span>
        <span className="font-bold">
          {recording ? `recording ${fmtDuration(elapsed)} — tap to stop` : "tap to record"}
        </span>
      </button>

      <div className="hidden flex-col items-center gap-1 sm:flex">
        <UploadIcon width={28} height={28} className="text-olive" />
        <p className="text-lg font-bold">upload audio files</p>
        <p className="text-sm text-muted">drop them here: mp3, m4a, wav or webm</p>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted sm:hidden">
        <span className="h-px w-8 bg-ink/30" /> or <span className="h-px w-8 bg-ink/30" />
      </div>

      <Button variant="secondary" onClick={onBrowse}>
        browse files
      </Button>
    </div>
  );
}

function StarCard({
  topic,
  index,
  expandedId,
  onToggle,
  onPatch,
  onRemove,
}: {
  topic: Topic;
  index: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onPatch: (id: string, patch: Partial<Topic>) => void;
  onRemove: (id: string) => void;
}) {
  // Desktop always expanded; mobile expands only the matching id.
  const mobileExpanded = expandedId === topic.id;

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-olive">
          topic {index + 1} · from {topic.sourceFileName ?? "recording"}
        </p>
        <input
          value={topic.title}
          onChange={(e) => onPatch(topic.id, { title: e.target.value })}
          placeholder="[Topic title]"
          aria-label="Topic title"
          className="mt-1 w-full bg-transparent text-xl font-bold placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <IconButton
          label="Edit topic"
          className="sm:hidden"
          onClick={() => onToggle(topic.id)}
        >
          <ChevronDownIcon
            className={`transition-transform ${mobileExpanded ? "rotate-180" : ""}`}
          />
        </IconButton>
        <IconButton label="Edit topic" className="hidden sm:inline-flex">
          <EditIcon />
        </IconButton>
        <IconButton
          label="Remove topic"
          tone="danger"
          onClick={() => onRemove(topic.id)}
        >
          <TrashIcon />
        </IconButton>
      </div>
    </div>
  );

  const fields = (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
      <StarField
        letter="S"
        name="situation"
        hint="the context"
        value={topic.situation}
        onChange={(v) => onPatch(topic.id, { situation: v })}
      />
      <StarField
        letter="T"
        name="task"
        hint="what needed to be done"
        value={topic.task}
        onChange={(v) => onPatch(topic.id, { task: v })}
      />
      <StarField
        letter="A"
        name="action"
        hint="what you did"
        value={topic.action}
        onChange={(v) => onPatch(topic.id, { action: v })}
      />
      <StarField
        letter="R"
        name="result"
        hint="the outcome and impact"
        value={topic.result}
        onChange={(v) => onPatch(topic.id, { result: v })}
      />
    </div>
  );

  return (
    <Card>
      {header}
      {/* Desktop: always show fields. Mobile: only when expanded. */}
      <div className="hidden sm:block">{fields}</div>
      {mobileExpanded && <div className="sm:hidden">{fields}</div>}
    </Card>
  );
}

function StarField({
  letter,
  name,
  hint,
  value,
  onChange,
}: {
  letter: string;
  name: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">
        <span className="text-olive">{letter}</span>
        <span className="text-muted"> – {name}</span>
      </span>
      <TextArea
        aria-label={`${name} (${letter})`}
        rows={3}
        placeholder={hint}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function UndoToast({
  onUndo,
  onExpire,
}: {
  onUndo: () => void;
  onExpire: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onExpire, 5000);
    return () => clearTimeout(t);
  }, [onExpire]);
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-[var(--radius-sketch)] border border-ink bg-surface px-4 py-3 sketch-shadow-sm sm:bottom-6"
    >
      <span>Topic removed.</span>
      <button
        onClick={onUndo}
        className="font-bold text-olive underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
      >
        Undo
      </button>
    </div>
  );
}
