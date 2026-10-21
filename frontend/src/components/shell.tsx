/*
  App shell — the responsive navigation chrome shared by all three screens.

  Decision: ONE client shell with a `tab` state rather than three Next.js routes.
  The spec treats topics/resume/profile as tabs over one shared experience
  database, and switching must preserve in-progress state (half-filled profile,
  drafted topics). Route changes would remount and lose that. So navigation is
  local state, lifted to page.tsx.

  Desktop (N-1): centred wordmark + three text tabs with an orange active underline.
  Mobile (N-2): wordmark + hamburger at the top, a fixed bottom tab bar for the
  three tabs. The hamburger holds secondary items (settings/help/account/sign out).
*/
"use client";

import { useState } from "react";
import type { TabId } from "@/lib/types";
import { Wordmark } from "./ui";
import {
  MenuIcon,
  CloseIcon,
  TopicsIcon,
  ResumeIcon,
  ProfileIcon,
} from "./icons";

const TABS: { id: TabId; label: string; Icon: typeof TopicsIcon }[] = [
  { id: "topics", label: "topics", Icon: TopicsIcon },
  { id: "resume", label: "resume", Icon: ResumeIcon },
  { id: "profile", label: "profile", Icon: ProfileIcon },
];

export function Header({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-dashed border-ink/40 bg-paper">
      {/* Desktop: centred wordmark + text tabs */}
      <div className="mx-auto hidden w-full max-w-5xl flex-col items-center gap-3 px-6 py-5 sm:flex">
        <Wordmark className="text-2xl" />
        <nav aria-label="Primary" className="flex items-center gap-8">
          {TABS.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative min-h-11 px-1 text-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive ${
                  isActive ? "font-bold text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded bg-orange" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile: wordmark + hamburger */}
      <div className="flex items-center justify-between px-4 py-3 sm:hidden">
        <Wordmark className="text-xl" />
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sketch)] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile secondary menu (settings/help/account/sign out live here) */}
      {menuOpen && (
        <div className="border-t border-dashed border-ink/40 px-4 pb-4 sm:hidden">
          <ul className="flex flex-col py-2 text-muted">
            {["Settings", "Help", "Account", "Sign out"].map((item) => (
              <li key={item}>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full min-h-11 rounded-[var(--radius-sketch)] px-2 text-left hover:bg-sage-tint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

/** Fixed bottom tab bar, mobile only (N-2). */
export function BottomTabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-dashed border-ink/50 bg-paper sm:hidden"
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        const { Icon } = t;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-olive ${
              isActive ? "font-bold text-ink" : "text-muted"
            }`}
          >
            {isActive && (
              <span className="absolute inset-x-6 top-0 h-[3px] rounded bg-orange" />
            )}
            <Icon
              width={22}
              height={22}
              className={isActive ? "text-olive" : "text-muted"}
            />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
