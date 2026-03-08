import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Upload, Smartphone, Building2, CheckCircle2, Clock, Copy, Banknote, Eye, FileText, Download, AlertCircle } from "lucide-react";
import { useDashboardPayments, useSubmitPayment } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  Approved: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Rejected: "bg-destructive/10 text-destructive",
};

const allPaymentMethods = [
  { id: "bank_deposit", label: "Bank Deposit", icon: Building2 },
  { id: "bank_transfer", label: "Wire Transfer", icon: Building2 },
  { id: "cheque_deposit", label: "Cheque Deposit", icon: FileText },
  { id: "mobile_bkash", label: "bKash", icon: Smartphone },
  { id: "mobile_nagad", label: "Nagad", icon: Smartphone },
  { id: "mobile_rocket", label: "Rocket", icon: Smartphone },
  { id: "card", label: "Card Payment", icon: CreditCard },
];

const DashboardPayments = () => {
  const [showMakePayment, setShowMakePayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useDashboardPayments();
  const submitPayment = useSubmitPayment();
  const { toast } = useToast();

  const paymentHistory = (data as any)?.paymentHistory || [];
  // Bank accounts configured by admin
  const bankAccounts = (data as any)?.bankAccounts || [];
  // Payment methods enabled by admin
  const enabledMethodIds: string[] = (data as any)?.enabledPaymentMethods || allPaymentMethods.map(m => m.id);
  const availableMethods = allPaymentMethods.filter(m => enabledMethodIds.includes(m.id));

  // Auto-select first available method
  const activeMethod = paymentMethod && enabledMethodIds.includes(paymentMethod) ? paymentMethod : (availableMethods[0]?.id || "");

  const selectedBankDetails = bankAccounts.find((b: any) => b.accNo === selectedBank || b.id === selectedBank);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if ((activeMethod === "bank_deposit" || activeMethod === "bank_transfer") && !selectedBank) {
      toast({ title: "Error", description: "Please select a bank account", variant: "destructive" });
      return;
    }
    if (!receiptFile && activeMethod !== "card") {
      toast({ title: "Error", description: "Please upload your payment receipt", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('paymentMethod', activeMethod);
    formData.append('amount', amount);
    formData.append('paymentDate', paymentDate);
    formData.append('bookingRef', bookingRef);
    if (selectedBank) formData.append('depositBank', selectedBank);
    if (chequeNo) formData.append('chequeNo', chequeNo);
    if (chequeBank) formData.append('chequeBank', chequeBank);
    if (chequeDate) formData.append('chequeDate', chequeDate);
    if (transactionId) formData.append('transactionId', transactionId);
    if (receiptFile) formData.append('receipt', receiptFile);

    try {
      await submitPayment.mutateAsync(Object.fromEntries(formData));
      toast({ title: "Payment Submitted", description: "Your payment request has been submitted for review" });
      setShowMakePayment(false);
      setAmount(""); setPaymentDate(""); setBookingRef(""); setReceiptFile(null); setSelectedBank("");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Manage Payments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Submit payments and track approval status</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowMakePayment(!showMakePayment)}>
          <Banknote className="w-4 h-4 mr-1.5" /> Make Payment
        </Button>
      </div>

      <DataLoader isLoading={isLoading} error={error} skeleton="dashboard" retry={refetch}>
        {/* Make Payment Form */}
        {showMakePayment && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Create New Payment Request</CardTitle>
              <CardDescription>Select a payment method enabled by admin and upload your receipt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No payment methods available</p>
                  <p className="text-xs mt-1">Please contact support for assistance</p>
                </div>
              ) : (
                <>
                  {/* Payment Method Selection — only admin-enabled methods */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Payment Methods</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {availableMethods.map(m => (
                        <button key={m.id} onClick={() => { setPaymentMethod(m.id); setSelectedBank(""); setTransactionId(""); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                            activeMethod === m.id
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/30 text-muted-foreground"
                          }`}>
                          <m.icon className="w-5 h-5" />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank Deposit / Wire Transfer — select from admin-configured banks */}
                  {(activeMethod === "bank_deposit" || activeMethod === "bank_transfer") && (
                    <>
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">
                          {activeMethod === "bank_transfer" ? "Transfer To (Select Bank)" : "Deposit To (Select Bank)"} *
                        </Label>
                        <Select value={selectedBank} onValueChange={setSelectedBank}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a bank account..." />
                          </SelectTrigger>
                          <SelectContent>
                            {bankAccounts.map((acc: any, i: number) => (
                              <SelectItem key={i} value={acc.accNo || acc.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                                  <span className="font-medium">{acc.bank || acc.bankName}</span>
                                  <span className="text-muted-foreground">— {acc.accNo || acc.accountNumber}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show selected bank details */}
                      {selectedBankDetails && (
                        <div className="bg-muted/50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {activeMethod === "bank_transfer" ? "Wire transfer to this account" : "Deposit at this bank"}
                          </p>
                          <div className="flex items-start gap-3 p-3 bg-card rounded-lg border border-primary/20">
                            <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1 text-sm space-y-0.5">
                              <p className="font-bold text-base">{selectedBankDetails.bank || selectedBankDetails.bankName}</p>
                              <p className="text-muted-foreground">{selectedBankDetails.accName || selectedBankDetails.accountName}</p>
                              <p className="font-mono font-bold text-lg tracking-wider">{selectedBankDetails.accNo || selectedBankDetails.accountNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                Branch: {selectedBankDetails.branch} • Routing: {selectedBankDetails.routing || selectedBankDetails.routingNumber}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                              onClick={() => copyToClipboard(selectedBankDetails.accNo || selectedBankDetails.accountNumber)}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-xs font-semibold text-primary">Instructions:</p>
                            <ol className="text-xs text-muted-foreground mt-1 space-y-1 list-decimal list-inside">
                              {activeMethod === "bank_transfer" ? (
                                <>
                                  <li>Log into your bank's online/mobile banking</li>
                                  <li>Add the above account as beneficiary</li>
                                  <li>Transfer the exact amount</li>
                                  <li>Take a screenshot of the confirmation</li>
                                  <li>Upload the screenshot below as receipt</li>
                                </>
                              ) : (
                                <>
                                  <li>Visit the above bank branch</li>
                                  <li>Fill a deposit slip with the account details above</li>
                                  <li>Deposit the exact amount</li>
                                  <li>Take a photo of the deposit slip</li>
                                  <li>Upload it below as receipt</li>
                                </>
                              )}
                            </ol>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Cheque Deposit */}
                  {activeMethod === "cheque_deposit" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><Label>Cheque Number *</Label><Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Enter cheque number" className="h-11" /></div>
                        <div className="space-y-1.5"><Label>Cheque Issued Bank *</Label><Input value={chequeBank} onChange={e => setChequeBank(e.target.value)} placeholder="Enter bank name" className="h-11" /></div>
                        <div className="space-y-1.5"><Label>Cheque Date *</Label><Input type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} className="h-11" /></div>
                        <div className="space-y-1.5">
                          <Label>Deposited In *</Label>
                          <Select value={selectedBank} onValueChange={setSelectedBank}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Select bank..." /></SelectTrigger>
                            <SelectContent>
                              {bankAccounts.map((acc: any, i: number) => (
                                <SelectItem key={i} value={acc.accNo || acc.id}>{acc.bank || acc.bankName} — {acc.accNo || acc.accountNumber}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Banking */}
                  {(activeMethod === "mobile_bkash" || activeMethod === "mobile_nagad" || activeMethod === "mobile_rocket") && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border-2 text-center ${
                        activeMethod === "mobile_bkash" ? "border-[#E2136E]/30 bg-[#E2136E]/5" :
                        activeMethod === "mobile_nagad" ? "border-[#F6A21E]/30 bg-[#F6A21E]/5" :
                        "border-[#8B2B8B]/30 bg-[#8B2B8B]/5"
                      }`}>
                        <Smartphone className={`w-8 h-8 mx-auto mb-2 ${
                          activeMethod === "mobile_bkash" ? "text-[#E2136E]" :
                          activeMethod === "mobile_nagad" ? "text-[#F6A21E]" :
                          "text-[#8B2B8B]"
                        }`} />
                        <p className="text-sm font-bold">
                          {activeMethod === "mobile_bkash" ? "bKash" : activeMethod === "mobile_nagad" ? "Nagad" : "Rocket"} Payment
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Send money to the merchant number and enter the transaction ID</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Transaction ID *</Label>
                        <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TRX8G7K4L2M9N" className="h-11" />
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  {activeMethod === "card" && (
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
                  {activeMethod !== "card" && (
                    <div className="space-y-1.5">
                      <Label>Payment Slip / Receipt (Max 1MB — JPG, JPEG, PNG, PDF) *</Label>
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
                </>
              )}
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
          <CardContent className="p-0 table-responsive">
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
                        {txn.method?.includes("Bank") || txn.method?.includes("Wire") ? <Building2 className="w-4 h-4 text-primary" /> :
                         txn.method?.includes("bKash") || txn.method?.includes("Nagad") || txn.method?.includes("Rocket") || txn.method?.includes("Mobile") ? <Smartphone className="w-4 h-4 text-primary" /> :
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