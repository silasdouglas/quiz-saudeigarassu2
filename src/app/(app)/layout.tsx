import type { ReactNode } from "react";
import { requireUser } from "@/lib/dal";
import { SiteHeader } from "@/components/site-header";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader profile={profile} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
