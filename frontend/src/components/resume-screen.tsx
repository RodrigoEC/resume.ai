/*
  Resume screen (R-1 … R-5). Tailor-a-resume loop:
  paste a job description -> find matching experiences -> review resume-style
  bullets -> edit/drop -> generate.

  Spec behaviours:
  - R-1: 50–20,000 char JD; the run button is disabled until >= 50 chars.
  - R-2: requires at least one saved topic, otherwise prompts to add topics.
  - R-3: each match shows role/project, source topic and editable bullets.
  - R-4: bullets editable inline; dropping a match excludes it.
  - R-5: generate produces a preview (stubbed markdown here).
*/
"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CountBadge,
  FooterHint,
  IconButton,
  PageTitle,
  TextArea,
} from "@/components/ui";
import { EditIcon, TrashIcon } from "@/components/icons";
import { listSavedTopics, matchJob } from "@/lib/store";
import type { Match, TabId } from "@/lib/types";

const MIN_JD = 50;
const MAX_JD = 20_000;

export function ResumeScreen({ onGoToTab }: { onGoToTab: (t: TabId) => void }) {
  const [jd, setJd] = useState("");
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [finding, setFinding] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  useEffect(() => {
    listSavedTopics().then((t) => setSavedCount(t.length));
  }, []);

  const tooShort = jd.trim().length < MIN_JD;
  const hasSaved = (savedCount ?? 0) > 0;

  async function find() {
    setFinding(true);
    setGenerated(null);
    const result = await matchJob(jd);
    setMatches(result);
    setFinding(false);
  }

  function patchBullet(matchId: string, idx: number, text: string) {
    setMatches((prev) =>
      prev
        ? prev.map((m) =>
            m.id === matchId
              ? { ...m, bullets: m.bullets.map((b, i) => (i === idx ? text : b)) }
              : m,
          )
        : prev,
    );
  }

  function dropMatch(id: string) {
    setMatches((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
  }

  const included = matches?.filter((m) => m.included) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageTitle>Tailor a resume</PageTitle>
        <p className="mt-3 max-w-xl text-muted">
          Paste a job description. We match it against your saved topics and pick
          the experiences that fit the role best.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Job description</h2>
          <span className="text-olive" aria-hidden="true">
            ·········▸
          </span>
          <span className="text-sm text-olive">
            used to select the right experiences from your database
          </span>
        </div>
        <div className="mt-4">
          <TextArea
            aria-label="Job description"
            rows={8}
            maxLength={MAX_JD}
            placeholder="paste the full job posting: responsibilities, requirements and nice-to-haves"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{tooShort ? `at least ${MIN_JD} characters` : "\u00a0"}</span>
            <span>
              {jd.length.toLocaleString()} / {MAX_JD.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={find} disabled={tooShort || finding}>
            {finding ? "finding…" : "find matching experiences"}
          </Button>
        </div>
      </Card>

      {/* R-2: no saved topics yet -> prompt to add some */}
      {!hasSaved && matches == null && (
        <Card className="border-solid">
          <p className="text-muted">
            You have no saved experiences yet. Record and save a few topics first,
            and we&apos;ll match them to this role.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => onGoToTab("topics")}>
              go to topics
            </Button>
          </div>
        </Card>
      )}

      {/* Matched experiences */}
      {matches != null && (
        <div className="flex flex-col gap-5 border-t border-dashed border-ink/40 pt-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="highlight text-2xl font-bold">Matched experiences</h2>
            <CountBadge>
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </CountBadge>
          </div>
          <p className="max-w-xl text-muted">
            Your most relevant topics, summarized in resume style.
          </p>

          {matches.length === 0 && (
            <p className="text-muted">
              No matches found. Try a longer or more specific job description.
            </p>
          )}

          {matches.map((m, i) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-olive">
                    match {i + 1} · from topic {m.topicTitle}
                  </p>
                  <input
                    value={m.roleOrProject}
                    onChange={(e) =>
                      setMatches((prev) =>
                        prev
                          ? prev.map((x) =>
                              x.id === m.id
                                ? { ...x, roleOrProject: e.target.value }
                                : x,
                            )
                          : prev,
                      )
                    }
                    aria-label="Role or project"
                    placeholder="[Role or project]"
                    className="mt-1 w-full bg-transparent text-xl font-bold placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  <IconButton label="Edit match">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    label="Drop match"
                    tone="danger"
                    onClick={() => dropMatch(m.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {(m.bullets.length ? m.bullets : ["", ""]).map((b, bi) => (
                  <li key={bi} className="flex items-start gap-2">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
                    <input
                      value={b}
                      onChange={(e) => patchBullet(m.id, bi, e.target.value)}
                      aria-label={`Bullet ${bi + 1}`}
                      placeholder="[Action verb] [what you did], [measurable result]"
                      className="min-h-9 w-full bg-transparent placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
                    />
                  </li>
                ))}
              </ul>
            </Card>
          ))}

          {matches.length > 0 && (
            <div className="flex flex-col items-end gap-3 border-t border-dashed border-ink/40 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <FooterHint>builds your tailored resume from these experiences</FooterHint>
              <Button
                onClick={() =>
                  setGenerated(
                    `# Tailored resume\n\nGenerated from ${included.length} experience(s). The full preview + PDF/Markdown export lands when the backend generator is wired (R-5, R-6).`,
                  )
                }
                disabled={included.length === 0}
              >
                generate resume
              </Button>
            </div>
          )}
        </div>
      )}

      {generated && (
        <Card className="border-solid">
          <h2 className="text-lg font-bold text-olive">Resume preview</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-ink">{generated}</pre>
        </Card>
      )}
    </div>
  );
}
