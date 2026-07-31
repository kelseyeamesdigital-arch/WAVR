import { createClient, getCurrentUser } from "@/lib/supabase/server";
import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, logo_url, website, address, phone, email, primary_color")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <ProfileSettingsForm
        userId={user!.id}
        initial={profile ?? { business_name: "", logo_url: null, website: null, address: null, phone: null, email: null, primary_color: null }}
      />
      <div className="mt-5">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
