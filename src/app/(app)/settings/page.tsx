import { requireUser } from "@/lib/dal";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const profile = await requireUser();
  return <SettingsForm profile={profile} />;
}
