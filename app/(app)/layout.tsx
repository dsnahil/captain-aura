import type { Metadata } from "next";
import { SyncProvider } from "@/components/auth/sync-provider";
import { BottomNav, TopNav } from "@/components/nav/app-nav";
import { DemoBanner } from "@/components/nav/demo-banner";
import { RequireProfile } from "@/components/nav/require-profile";

/** Everything behind onboarding is private and must stay out of search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <DemoBanner />
      <SyncProvider>
        <RequireProfile>
          {/* Generous gutters; bottom padding clears the mobile tab bar. */}
          <main className="mx-auto w-full max-w-2xl px-5 pt-8 pb-32 sm:px-6 md:pt-14 md:pb-20">
            {children}
          </main>
        </RequireProfile>
      </SyncProvider>
      <BottomNav />
    </div>
  );
}
