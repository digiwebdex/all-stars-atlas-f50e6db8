import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Bell, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboardSettings, useUpdateProfile, useChangePassword } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";
import { mockSettings } from "@/lib/mock-data";

const NOTIF_KEY = "user_notification_prefs";

const defaultNotifs: Record<string, boolean> = {
  email: true, sms: true, promo: false, price: false,
};

function loadNotifs(): Record<string, boolean> {
  try { const s = localStorage.getItem(NOTIF_KEY); if (s) return JSON.parse(s); } catch {} return defaultNotifs;
}
function saveNotifs(v: Record<string, boolean>) { localStorage.setItem(NOTIF_KEY, JSON.stringify(v)); }

const DashboardSettings = () => {
  const { data, isLoading, error, refetch } = useDashboardSettings();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { toast } = useToast();

  const resolved = (data as any)?.profile || (data as any)?.user ? (data as any) : mockSettings;
  const profile = resolved?.profile || resolved?.user || {};
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [notifs, setNotifs] = useState<Record<string, boolean>>(loadNotifs);

  useEffect(() => {
    if (profile.firstName) setForm({ firstName: profile.firstName || '', lastName: profile.lastName || '', email: profile.email || '', phone: profile.phone || '' });
  }, [profile.firstName, profile.lastName, profile.email, profile.phone]);

  const toggleNotif = (key: string) => {
    setNotifs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveNotifs(next);
      toast({ title: next[key] ? "Enabled" : "Disabled", description: `Notification preference updated.` });
      return next;
    });
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(form as any);
      toast({ title: "Saved", description: "Profile updated successfully" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (pwForm.newPassword !== pwForm.confirm) { toast({ title: "Error", description: "Passwords don't match", variant: "destructive" }); return; }
    try {
      await changePassword.mutateAsync({ currentPassword: pwForm.current, newPassword: pwForm.newPassword } as any);
      toast({ title: "Saved", description: "Password updated" });
      setPwForm({ current: '', newPassword: '', confirm: '' });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const notifItems = [
    { key: "email", label: "Email Notifications", desc: "Receive booking confirmations and updates via email" },
    { key: "sms", label: "SMS Notifications", desc: "Get text alerts for booking status changes" },
    { key: "promo", label: "Promotional Offers", desc: "Receive exclusive deals and offers" },
    { key: "price", label: "Price Alerts", desc: "Get notified when prices drop on your watchlist" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <DataLoader isLoading={isLoading} error={null} skeleton="detail" retry={refetch}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
              <div><CardTitle className="text-lg">Profile Information</CardTitle><CardDescription>Update your personal details</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Lock className="w-5 h-5 text-primary" /></div>
              <div><CardTitle className="text-lg">Change Password</CardTitle><CardDescription>Ensure your account stays secure</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>Current Password</Label><Input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({...f, current: e.target.value}))} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>New Password</Label><Input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} /></div>
              <div className="space-y-1.5"><Label>Confirm New Password</Label><Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f, confirm: e.target.value}))} /></div>
            </div>
            <Button onClick={handleChangePassword} disabled={changePassword.isPending}>{changePassword.isPending ? "Updating..." : "Update Password"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
              <div><CardTitle className="text-lg">Notifications</CardTitle><CardDescription>Manage your notification preferences</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <Switch checked={notifs[item.key] ?? false} onCheckedChange={() => toggleNotif(item.key)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
              <div><CardTitle className="text-lg">Security</CardTitle><CardDescription>Manage account security settings</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Add an extra layer of security</p></div>
              <Switch />
            </div>
            <Separator />
            <div>
              <Button variant="destructive" size="sm" onClick={() => toast({ title: "Account Deletion", description: "Please contact support@seventrip.com.bd to delete your account.", variant: "destructive" })}>Delete Account</Button>
              <p className="text-xs text-muted-foreground mt-2">This action is irreversible.</p>
            </div>
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  );
};

export default DashboardSettings;
