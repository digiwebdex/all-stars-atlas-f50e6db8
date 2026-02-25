import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CreditCard, Upload, Smartphone, Building, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

const paymentMethods = [
  { name: "bKash", type: "mobile", icon: Smartphone, status: "active", last4: "4521" },
  { name: "Nagad", type: "mobile", icon: Smartphone, status: "active", last4: "7832" },
  { name: "Visa Card", type: "card", icon: CreditCard, status: "active", last4: "4242" },
];

const pendingPayments = [
  { id: "PAY-001", booking: "BK-20250002", amount: "৳17,000", due: "2025-03-20", method: "Bank Transfer" },
];

const DashboardPayments = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Saved Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
              <CardDescription>Your saved payment methods</CardDescription>
            </div>
            <Button size="sm">Add New</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <method.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{method.name}</p>
                  <p className="text-xs text-muted-foreground">•••• {method.last4}</p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success text-[10px]">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Payments</CardTitle>
          <CardDescription>Complete your pending payments to confirm bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle2 className="w-4 h-4 text-success" /> No pending payments
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-warning/30 bg-warning/5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{p.booking}</p>
                      <p className="text-xs text-muted-foreground">Due: {p.due} • {p.method}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{p.amount}</span>
                    <Button size="sm" onClick={() => setShowUpload(true)}>Pay Now</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Receipt Upload */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Bank Receipt</CardTitle>
            <CardDescription>Upload your bank transfer receipt for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                    <SelectItem value="rocket">Rocket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input placeholder="Enter transaction ID" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Receipt Image</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button>Submit Receipt</Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPayments;
