/*
  Profile screen (P-1 … P-6). Set-up-once loop; fills the resume header + fixed
  sections.

  Spec behaviours:
  - P-1: full name + email required; email validated; others optional.
  - P-2: LinkedIn/GitHub/portfolio with URL validation.
  - P-3: base summary up to 600 chars.
  - P-4: add/edit/remove education entries.
  - P-5: skill chips; duplicates ignored.
  - P-6: save persists everything; unsaved changes warn before leaving the tab
    (wired via the `dirty` flag the parent reads).
*/
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Field,
  FooterHint,
  IconButton,
  PageTitle,
  SectionHeading,
  SkillChip,
  TextArea,
} from "@/components/ui";
import { TrashIcon } from "@/components/icons";
import {
  emptyProfile,
  getProfile,
  newEducationEntry,
  saveProfile,
} from "@/lib/store";
import type { Profile } from "@/lib/types";

const SUMMARY_MAX = 600;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$/;

export function ProfileScreen({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [baseline, setBaseline] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      setBaseline(JSON.stringify(p));
      setLoaded(true);
    });
  }, []);

  const dirty = useMemo(
    () => loaded && JSON.stringify(profile) !== baseline,
    [loaded, profile, baseline],
  );

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // P-6: browser-level guard against closing/reloading with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }
  function setLink(key: keyof Profile["links"], value: string) {
    setProfile((p) => ({ ...p, links: { ...p.links, [key]: value } }));
  }

  const emailInvalid = profile.email.length > 0 && !EMAIL_RE.test(profile.email);
  const canSave =
    profile.fullName.trim().length > 0 && EMAIL_RE.test(profile.email);

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    // P-5: duplicates ignored (case-insensitive).
    if (profile.skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setSkillInput("");
      return;
    }
    set("skills", [...profile.skills, s]);
    setSkillInput("");
  }

  async function handleSave() {
    setSaving(true);
    const saved = await saveProfile(profile);
    setBaseline(JSON.stringify(saved));
    setSavedAt(Date.now());
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageTitle>Your profile</PageTitle>
        <p className="mt-3 max-w-xl text-muted">
          The details that go at the top of every resume we generate. Fill them
          in once and they stay the same for every job.
        </p>
      </div>

      {/* P-1 Personal details */}
      <Card>
        <SectionHeading>Personal details</SectionHeading>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="full name"
            required
            placeholder="[Your name]"
            value={profile.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
          <Field
            label="headline"
            placeholder="[Target role, e.g. AI Engineer]"
            value={profile.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
          <Field
            label="email"
            required
            type="email"
            placeholder="[you@email.com]"
            value={profile.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={emailInvalid || undefined}
            hint={emailInvalid ? "Enter a valid email address." : undefined}
          />
          <Field
            label="phone"
            placeholder="[Phone number]"
            value={profile.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Field
            label="location"
            placeholder="[City, country]"
            value={profile.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>
      </Card>

      {/* P-2 Links */}
      <Card>
        <SectionHeading>Links</SectionHeading>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="LinkedIn"
            placeholder="[linkedin.com/in/…]"
            value={profile.links.linkedin}
            onChange={(e) => setLink("linkedin", e.target.value)}
            aria-invalid={
              (profile.links.linkedin && !URL_RE.test(profile.links.linkedin)) ||
              undefined
            }
          />
          <Field
            label="GitHub"
            placeholder="[github.com/…]"
            value={profile.links.github}
            onChange={(e) => setLink("github", e.target.value)}
            aria-invalid={
              (profile.links.github && !URL_RE.test(profile.links.github)) ||
              undefined
            }
          />
          <Field
            label="portfolio or website"
            placeholder="[your-site.com]"
            value={profile.links.website}
            onChange={(e) => setLink("website", e.target.value)}
            aria-invalid={
              (profile.links.website && !URL_RE.test(profile.links.website)) ||
              undefined
            }
          />
        </div>
      </Card>

      {/* P-3 Professional summary */}
      <Card>
        <SectionHeading>Professional summary</SectionHeading>
        <p className="mt-2 text-sm text-muted">
          a short base summary; the AI adapts it to each job description
        </p>
        <div className="mt-4">
          <TextArea
            aria-label="Professional summary"
            rows={4}
            maxLength={SUMMARY_MAX}
            placeholder="[2 or 3 sentences about who you are professionally]"
            value={profile.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-muted">
            {profile.summary.length} / {SUMMARY_MAX}
          </p>
        </div>
      </Card>

      {/* P-4 Education */}
      <Card>
        <SectionHeading>Education</SectionHeading>
        <div className="mt-4 flex flex-col gap-4">
          {profile.education.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <Field
                label="school"
                placeholder="[University]"
                value={entry.school}
                onChange={(e) =>
                  set(
                    "education",
                    profile.education.map((x) =>
                      x.id === entry.id ? { ...x, school: e.target.value } : x,
                    ),
                  )
                }
              />
              <Field
                label="degree"
                placeholder="[Degree, field]"
                value={entry.degree}
                onChange={(e) =>
                  set(
                    "education",
                    profile.education.map((x) =>
                      x.id === entry.id ? { ...x, degree: e.target.value } : x,
                    ),
                  )
                }
              />
              <Field
                label="years"
                placeholder="[2018–2022]"
                value={entry.years}
                onChange={(e) =>
                  set(
                    "education",
                    profile.education.map((x) =>
                      x.id === entry.id ? { ...x, years: e.target.value } : x,
                    ),
                  )
                }
              />
              <IconButton
                label="Remove education entry"
                tone="danger"
                onClick={() =>
                  set(
                    "education",
                    profile.education.filter((x) => x.id !== entry.id),
                  )
                }
              >
                <TrashIcon />
              </IconButton>
            </div>
          ))}
          <div>
            <Button
              variant="secondary"
              onClick={() =>
                set("education", [...profile.education, newEducationEntry()])
              }
            >
              + add education
            </Button>
          </div>
        </div>
      </Card>

      {/* P-5 Skills */}
      <Card>
        <SectionHeading>Skills</SectionHeading>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {profile.skills.map((s) => (
            <SkillChip
              key={s}
              label={s}
              onRemove={() =>
                set(
                  "skills",
                  profile.skills.filter((x) => x !== s),
                )
              }
            />
          ))}
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            onBlur={addSkill}
            aria-label="Add a skill"
            placeholder="+ add a skill"
            className="min-h-11 min-w-40 rounded-[var(--radius-sketch)] border border-dashed border-ink bg-surface px-3 py-1.5 placeholder:text-muted/70 focus-visible:border-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
          />
        </div>
      </Card>

      {/* P-6 Save */}
      <div className="flex flex-col items-end gap-3 border-t border-dashed border-ink/40 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <FooterHint>
          {dirty
            ? "you have unsaved changes"
            : savedAt
              ? "profile saved"
              : "used in the header of every resume"}
        </FooterHint>
        <Button onClick={handleSave} disabled={!canSave || saving}>
          {saving ? "saving…" : "save profile"}
        </Button>
      </div>
    </div>
  );
}
