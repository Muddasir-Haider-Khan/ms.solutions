import { requireAdminRole } from "@/lib/permissions";
import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  await requireAdminRole();
  const result = await getSettings();
  const settings = result.success && result.data ? result.data : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company, invoice, and store settings.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
