import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Settings, Globe, Mail, CreditCard, Shield, Bell, Database } from "lucide-react";

const AdminSettings = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">System Settings</h1>

      {/* General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">General Settings</CardTitle>
              <CardDescription>Configure basic platform settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Site Name</Label>
              <Input defaultValue="TravelHub" />
            </div>
            <div className="space-y-1.5">
              <Label>Support Email</Label>
              <Input defaultValue="support@travelhub.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Default Currency</Label>
              <Select defaultValue="bdt">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bdt">BDT (৳)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Language</Label>
              <Select defaultValue="en">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="bn">বাংলা</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Payment Gateway */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Payment Gateways</CardTitle>
              <CardDescription>Configure payment methods</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "bKash", enabled: true },
            { name: "Nagad", enabled: true },
            { name: "Rocket", enabled: false },
            { name: "Visa/Mastercard", enabled: true },
            { name: "Bank Transfer", enabled: true },
          ].map((gw, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{gw.name}</p>
              </div>
              <Switch defaultChecked={gw.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Email Configuration</CardTitle>
              <CardDescription>SMTP settings for system emails</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>SMTP Host</Label>
              <Input placeholder="smtp.example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>SMTP Port</Label>
              <Input placeholder="587" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="noreply@travelhub.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <Button>Test & Save</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "New Booking Alert", desc: "Get notified for every new booking" },
            { label: "Payment Received", desc: "Alert when payment is received" },
            { label: "Refund Request", desc: "Notify on refund requests" },
            { label: "Low Inventory", desc: "Alert when availability is low" },
          ].map((n, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-xs text-muted-foreground">Clear all system cache and regenerate</p>
            </div>
            <Button variant="destructive" size="sm">Clear Cache</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Reset System</p>
              <p className="text-xs text-muted-foreground">Reset all settings to defaults</p>
            </div>
            <Button variant="destructive" size="sm">Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
