import { requireSession } from "@/lib/auth/session";
import { getApiKeys } from "./actions";
import { SettingsClient } from "./client";

export default async function SettingsPage() {
  await requireSession();
  const keys = await getApiKeys();
  return <SettingsClient initialKeys={keys} />;
}
