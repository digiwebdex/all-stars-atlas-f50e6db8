import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Upload, Smartphone, Building2, CheckCircle2, Clock, Copy, ArrowRight, Banknote, Eye, FileText, Download } from "lucide-react";

import { useDashboardPayments, useSubmitPayment } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  Approved: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Rejected: "bg-destructive/10 text-destructive",
};

const DashboardPayments = () => {
  const [showMakePayment, setShowMakePayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_deposit");
  const [depositBank, setDepositBank] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [mobileMethod, setMobileMethod] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useDashboardPayments();
  const submitPayment = useSubmitPayment();
  const { toast } = useToast();

  const paymentHistory = (data as any)?.paymentHistory || [];
  const bankAccounts = (data as any)?.bankAccounts || [];

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('paymentMethod', paymentMethod);
    formData.append('amount', amount);
    formData.append('paymentDate', paymentDate);
    formData.append('bookingRef', bookingRef);
    if (depositBank) formData.append('depositBank', depositBank);
    if (chequeNo) formData.append('chequeNo', chequeNo);
    if (chequeBank) formData.append('chequeBank', chequeBank);
    if (chequeDate) formData.append('chequeDate', chequeDate);
    if (transactionId) formData.append('transactionId', transactionId);
    if (mobileMethod) formData.append('mobileProvider', mobileMethod);
    if (receiptFile) formData.append('receipt', receiptFile);

    try {
      await submitPayment.mutateAsync(Object.fromEntries(formData));
      toast({ title: "Payment Submitted", description: "Your payment request has been submitted for review" });
      setShowMakePayment(false);
      setAmount(""); setPaymentDate(""); setBookingRef(""); setReceiptFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to submit payment", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Account number copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit payments and track approval status</p>
        </div>
        <Button onClick={() => setShowMakePayment(!showMakePayment)}>
          <Banknote className="w-4 h-4 mr-1.5" /> Make Payment
        </Button>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="dashboard" retry={refetch}>
        {/* Make Payment Form */}
        {showMakePayment && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Create New Payment Request</CardTitle>
              <CardDescription>Select a payment method and upload your receipt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Payment Methods</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "bank_deposit", label: "Bank Deposit", icon: Building2 },
                    { id: "bank_transfer", label: "Bank Transfer", icon: Building2 },
                    { id: "cheque_deposit", label: "Cheque Deposit", icon: FileText },
                    { id: "mobile_banking", label: "Mobile Banking", icon: Smartphone },
                    { id: "card", label: "Credit/Debit Card", icon: CreditCard },
                  ].map(m => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}>
                      <m.icon className="w-5 h-5" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Deposit / Transfer */}
              {(paymentMethod === "bank_deposit" || paymentMethod === "bank_transfer") && (
                <>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Deposited In</Label>
                    <Select value={depositBank} onValueChange={setDepositBank}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select bank account..." /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((acc: any, i: number) => (
                          <SelectItem key={i} value={acc.accNo}>{acc.bank} — {acc.accNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {bankAccounts.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deposit to one of these accounts</p>
                      {bankAccounts.map((acc: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                          <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 text-sm space-y-0.5">
                            <p className="font-bold">{acc.bank}</p>
                            <p className="text-muted-foreground">{acc.accName}</p>
                            <p className="font-mono font-semibold">{acc.accNo}</p>
                            <p className="text-xs text-muted-foreground">Branch: {acc.branch} • Routing: {acc.routing}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(acc.accNo)}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Cheque Deposit */}
              {paymentMethod === "cheque_deposit" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Cheque Number</Label><Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Enter cheque number" className="h-11" /></div>
                  <div className="space-y-1.5"><Label>Cheque Issued Bank</Label><Input value={chequeBank} onChange={e => setChequeBank(e.target.value)} placeholder="Enter bank name" className="h-11" /></div>
                  <div className="space-y-1.5"><Label>Cheque Issued Date</Label><Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} className="h-11" /></div>
                  <div className="space-y-1.5">
                    <Label>Deposited In</Label>
                    <Select value={depositBank} onValueChange={setDepositBank}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((acc: any, i: number) => (
                          <SelectItem key={i} value={acc.accNo}>{acc.bank} — {acc.accNo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Mobile Banking */}
              {paymentMethod === "mobile_banking" && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Select Provider</Label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { id: "bkash", label: "bKash", color: "bg-[#E2136E]/10 text-[#E2136E] border-[#E2136E]/30" },
                      { id: "nagad", label: "Nagad", color: "bg-[#F6A21E]/10 text-[#F6A21E] border-[#F6A21E]/30" },
                      { id: "rocket", label: "Rocket", color: "bg-[#8B2B8B]/10 text-[#8B2B8B] border-[#8B2B8B]/30" },
                    ].map(p => (
                      <button key={p.id} onClick={() => setMobileMethod(p.id)}
                        className={`p-3 rounded-xl border-2 text-sm font-bold text-center transition-all ${
                          mobileMethod === p.id ? p.color : "border-border text-muted-foreground hover:border-primary/30"
                        }`}>{p.label}</button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transaction ID</Label>
                    <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TRX8G7K4L2M9N" className="h-11" />
                  </div>
                </div>
              )}

              {/* Card */}
              {paymentMethod === "card" && (
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">You will be redirected to secure payment gateway</p>
                  <p className="text-xs text-muted-foreground mt-1">Gateway fee may apply</p>
                </div>
              )}

              <Separator />

              {/* Common Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount (BDT) *</Label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Max 2 decimal digits" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Date *</Label>
                  <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-11" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Booking Reference Number</Label>
                <Input value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="Optional — link to a specific booking" className="h-11" />
              </div>

              {/* Receipt Upload */}
              {paymentMethod !== "card" && (
                <div className="space-y-1.5">
                  <Label>Payment Slip (Max 1MB — JPG, JPEG, PNG, PDF) *</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) { if (e.target.files[0].size > 1024 * 1024) { toast({ title: "File too large", description: "Max 1MB allowed", variant: "destructive" }); return; } setReceiptFile(e.target.files[0]); }}} />
                    {receiptFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium">{receiptFile.name}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={e => { e.stopPropagation(); setReceiptFile(null); }}>Remove</Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to upload payment slip</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PNG, or PDF</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={submitPayment.isPending}>
                  {submitPayment.isPending ? "Submitting..." : "Submit Payment"}
                </Button>
                <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Payments List</CardTitle>
              <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> Export</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference No</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Payment Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created On</TableHead>
                  <TableHead className="hidden lg:table-cell">Created By</TableHead>
                  <TableHead className="hidden lg:table-cell">Channel</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />No payments found
                  </TableCell></TableRow>
                ) : paymentHistory.map((txn: any) => (
                  <TableRow key={txn.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-bold">{txn.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {txn.method?.includes("Bank") ? <Building2 className="w-4 h-4 text-primary" /> :
                         txn.method?.includes("bKash") || txn.method?.includes("Mobile") ? <Smartphone className="w-4 h-4 text-primary" /> :
                         <CreditCard className="w-4 h-4 text-primary" />}
                        <span className="text-sm">{txn.method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">৳{txn.amount}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={`text-[10px] ${statusColors[txn.status] || ''}`}>{txn.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{txn.date}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{txn.createdBy || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      <Badge variant="outline" className="text-[10px]">{txn.channel || 'Web'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs"><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DataLoader>
    </div>
  );
};

export default DashboardPayments;
