import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { CreditCard, Upload, Smartphone, Building2, CheckCircle2, Clock, Copy, ArrowRight, Banknote, QrCode } from "lucide-react";
import { useState } from "react";

const paymentMethods = [
  { name: "bKash", type: "mobile", icon: Smartphone, status: "active", last4: "4521", color: "bg-[hsl(340,80%,50%)]" },
  { name: "Nagad", type: "mobile", icon: Smartphone, status: "active", last4: "7832", color: "bg-[hsl(24,100%,50%)]" },
  { name: "Visa Card", type: "card", icon: CreditCard, status: "active", last4: "4242", color: "bg-[hsl(217,91%,50%)]" },
];

const pendingPayments = [
  { id: "PAY-001", booking: "BK-20260002", title: "Sea Pearl Beach Resort", amount: "৳17,000", due: "Mar 20, 2026", method: "Bank Transfer" },
  { id: "PAY-002", booking: "BK-20260008", title: "Maldives Package 3N/4D", amount: "৳68,000", due: "Apr 5, 2026", method: "Any" },
];

const paymentHistory = [
  { id: "TXN-001", date: "Feb 20, 2026", method: "bKash", amount: "৳4,500", booking: "BK-20260001", status: "Approved" },
  { id: "TXN-002", date: "Feb 15, 2026", method: "Visa Card", amount: "৳32,000", booking: "BK-20260003", status: "Approved" },
  { id: "TXN-003", date: "Feb 10, 2026", method: "Bank Transfer", amount: "৳28,500", booking: "BK-20260005", status: "Approved" },
  { id: "TXN-004", date: "Jan 25, 2026", method: "Bank Deposit", amount: "৳5,900", booking: "BK-20260006", status: "Rejected" },
  { id: "TXN-005", date: "Jan 10, 2026", method: "Nagad", amount: "৳8,200", booking: "BK-20260007", status: "Approved" },
];

const bankAccounts = [
  { bank: "BRAC Bank", accName: "Seven Trip Bangladesh Ltd", accNo: "1501-2040-0012-3456", branch: "Motijheel", routing: "060261523" },
  { bank: "Dutch-Bangla Bank", accName: "Seven Trip Bangladesh Ltd", accNo: "110-1101-2345-678", branch: "Gulshan", routing: "090261876" },
];

const statusColors: Record<string, string> = {
  Approved: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Rejected: "bg-destructive/10 text-destructive",
};

const DashboardPayments = () => {
  const [showMakePayment, setShowMakePayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Button onClick={() => setShowMakePayment(!showMakePayment)}>
          <Banknote className="w-4 h-4 mr-1.5" /> Make Payment
        </Button>
      </div>

      {/* Saved Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment Methods</CardTitle>
              <CardDescription>Your saved payment methods</CardDescription>
            </div>
            <Button size="sm" variant="outline">Add New</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center text-white`}>
                  <method.icon className="w-5 h-5" />
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
                      <p className="text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.booking} • Due: {p.due}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{p.amount}</span>
                    <Button size="sm" onClick={() => setShowMakePayment(true)}>Pay Now <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Payment Section */}
      {showMakePayment && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Make Payment</CardTitle>
            <CardDescription>Select a payment method and submit your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bank" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="bank">Bank Deposit</TabsTrigger>
                <TabsTrigger value="transfer">Bank Transfer</TabsTrigger>
                <TabsTrigger value="mobile">Mobile Banking</TabsTrigger>
                <TabsTrigger value="card">Card</TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Deposit to one of these accounts</p>
                  {bankAccounts.map((acc, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border mb-2 last:mb-0">
                      <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 text-sm space-y-0.5">
                        <p className="font-bold">{acc.bank}</p>
                        <p className="text-muted-foreground">{acc.accName}</p>
                        <p className="font-mono font-semibold">{acc.accNo}</p>
                        <p className="text-xs text-muted-foreground">Branch: {acc.branch} • Routing: {acc.routing}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Copy className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Bank Name</Label>
                    <Select><SelectTrigger className="h-11"><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent><SelectItem value="brac">BRAC Bank</SelectItem><SelectItem value="dbbl">Dutch-Bangla Bank</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Amount (৳)</Label><Input type="number" placeholder="17000" className="h-11" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Payment Date</Label><Input type="date" className="h-11" /></div>
                  <div className="space-y-1.5"><Label>Deposit Slip / Receipt</Label>
                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">JPG, PNG, PDF • Max 5MB</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="font-bold shadow-lg shadow-primary/20">Submit Payment</Button>
                  <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                </div>
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Transfer To</Label>
                    <Select><SelectTrigger className="h-11"><SelectValue placeholder="Select bank" /></SelectTrigger>
                      <SelectContent><SelectItem value="brac">BRAC Bank</SelectItem><SelectItem value="dbbl">Dutch-Bangla Bank</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Amount (৳)</Label><Input type="number" className="h-11" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Transaction Reference</Label><Input className="h-11" placeholder="Your bank ref number" /></div>
                  <div className="space-y-1.5"><Label>Transfer Date</Label><Input type="date" className="h-11" /></div>
                </div>
                <div className="space-y-1.5"><Label>Upload Proof</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Drag & drop or click to upload • JPG, PNG, PDF</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="font-bold">Submit</Button>
                  <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                </div>
              </TabsContent>

              <TabsContent value="mobile" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: "bKash", number: "01712-345678", color: "from-[hsl(340,80%,50%)] to-[hsl(340,60%,40%)]" },
                    { name: "Nagad", number: "01812-345678", color: "from-[hsl(24,100%,50%)] to-[hsl(24,80%,40%)]" },
                  ].map((m) => (
                    <div key={m.name} className={`p-4 rounded-xl bg-gradient-to-br ${m.color} text-white`}>
                      <p className="text-lg font-bold mb-1">{m.name}</p>
                      <p className="text-sm text-white/70 mb-2">Send to Merchant:</p>
                      <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                        <span className="font-mono font-bold text-sm flex-1">{m.number}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20"><Copy className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Payment Method</Label>
                    <Select><SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="bkash">bKash</SelectItem><SelectItem value="nagad">Nagad</SelectItem><SelectItem value="rocket">Rocket</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Transaction ID</Label><Input className="h-11" placeholder="e.g. 8G7K4L2M9N" /></div>
                </div>
                <div className="space-y-1.5"><Label>Amount (৳)</Label><Input type="number" className="h-11" /></div>
                <div className="flex gap-3">
                  <Button className="font-bold">Verify & Submit</Button>
                  <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-sm flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /> <strong>Discount Available:</strong> Use BRAC or EBL cards for up to 10% off</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Card Number</Label><Input className="h-11" placeholder="4242 4242 4242 4242" /></div>
                  <div className="space-y-1.5"><Label>Cardholder Name</Label><Input className="h-11" placeholder="JOHN DOE" /></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label>Expiry</Label><Input className="h-11" placeholder="MM/YY" /></div>
                  <div className="space-y-1.5"><Label>CVV</Label><Input className="h-11" placeholder="123" type="password" /></div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Amount (৳)</Label><Input type="number" className="h-11" /></div>
                </div>
                <div className="flex gap-3">
                  <Button className="font-bold shadow-lg shadow-primary/20">Pay Securely</Button>
                  <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {paymentHistory.map((txn) => (
              <div key={txn.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {txn.method.includes("bKash") || txn.method.includes("Nagad") ? <Smartphone className="w-5 h-5 text-primary" /> :
                   txn.method.includes("Card") ? <CreditCard className="w-5 h-5 text-primary" /> :
                   <Building2 className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{txn.method}</p>
                  <p className="text-xs text-muted-foreground">{txn.id} • {txn.booking} • {txn.date}</p>
                </div>
                <Badge className={`text-[10px] font-semibold ${statusColors[txn.status]}`}>{txn.status}</Badge>
                <span className="text-sm font-bold">{txn.amount}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPayments;
