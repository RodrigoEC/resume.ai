/*
  Root page. Owns the single piece of navigation state (`tab`) and the profile
  dirty flag used to guard tab switches (P-6). Everything below is client-side
  because the whole app is one interactive shell; see shell.tsx for why tabs are
  state rather than routes.
*/
"use client";

import { useCallback, useState } from "react";
import { BottomTabBar, Header } from "@/components/shell";
import { TopicsScreen } from "@/components/topics-screen";
import { ResumeScreen } from "@/components/resume-screen";
import { ProfileScreen } from "@/components/profile-screen";
import type { TabId } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState<TabId>("profile");
  const [profileDirty, setProfileDirty] = useState(false);

  // P-6: warn before leaving the Profile tab with unsaved changes.
  const changeTab = useCallback(
    (next: TabId) => {
      if (tab === "profile" && profileDirty && next !== "profile") {
        const leave = window.confirm(
          "You have unsaved profile changes. Leave this tab anyway?",
        );
        if (!leave) return;
      }
      setTab(next);
    },
    [tab, profileDirty],
  );

  return (
    <>
      <Header active={tab} onChange={changeTab} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 sm:px-6 sm:pb-16">
        {tab === "topics" && <TopicsScreen />}
        {tab === "resume" && <ResumeScreen onGoToTab={changeTab} />}
        {tab === "profile" && <ProfileScreen onDirtyChange={setProfileDirty} />}
      </main>

      <BottomTabBar active={tab} onChange={changeTab} />
    </>
  );
}
