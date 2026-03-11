import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Receipt, CreditCard, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBillCategories, useSubmitBillPayment } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const PayBillPage = () => {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [biller, setBiller] = useState(searchParams.get("biller") || "");
  const [account, setAccount] = useState(searchParams.get("account") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { data: catData, isLoading, error, refetch } = useBillCategories();
  const submitBill = useSubmitBillPayment();

  const categories = (catData as any)?.data || (catData as any)?.categories || [];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!category) errors.category = "Please select a category";
    if (!biller?.trim()) errors.biller = "Biller name is required";
    if (!account?.trim()) errors.account = "Account number is required";
    if (!amount?.trim()) errors.amount = "Amount is required";
    else if (Number(amount) < 1) errors.amount = "Amount must be positive";
    else if (Number(amount) > 500000) errors.amount = "Maximum amount is ৳500,000";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: "Error", description: Object.values(errors)[0], variant: "destructive" });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await submitBill.mutateAsync({ category, billerId: biller, accountNumber: account, amount: Number(amount) } as any);
      setSubmitted(true);
      toast({ title: "Success", description: "Bill payment submitted!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Payment failed", variant: "destructive" });
    }
  };

  const errClass = (f: string) => fieldErrors[f] ? "border-destructive ring-destructive/20 ring-2" : "";

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-success" /></div>
            <h2 className="text-xl font-bold">Payment Successful!</h2>
            <p className="text-sm text-muted-foreground">৳{Number(amount).toLocaleString()} paid to {biller}</p>
            <p className="text-xs text-muted-foreground">Account: {account}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setSubmitted(false); setBiller(""); setAccount(""); setAmount(""); }}>Pay Another Bill</Button>
              <Button asChild><Link to="/">Go Home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
      <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" /> Pay Bill</h1>
        <DataLoader isLoading={isLoading} error={error} skeleton="detail" retry={refetch}>
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className={fieldErrors.category ? "text-destructive" : ""}>Bill Category *</Label>
                <Select value={category} onValueChange={v => { setCategory(v); setFieldErrors(p => { const n = {...p}; delete n.category; return n; }); }}>
                  <SelectTrigger className={`h-11 ${errClass("category")}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((cat: any) => <SelectItem key={cat.id || cat} value={cat.id || cat.toLowerCase().replace(/ /g, '-')}>{cat.name || cat}</SelectItem>)}</SelectContent>
                </Select>
                {fieldErrors.category && <p className="text-[11px] text-destructive font-medium">{fieldErrors.category}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={fieldErrors.biller ? "text-destructive" : ""}>Biller Name *</Label>
                <Input value={biller} onChange={e => { setBiller(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.biller; return n; }); }} placeholder="e.g. DPDC, Titas Gas" className={`h-11 ${errClass("biller")}`} />
                {fieldErrors.biller && <p className="text-[11px] text-destructive font-medium">{fieldErrors.biller}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={fieldErrors.account ? "text-destructive" : ""}>Account / Subscriber Number *</Label>
                <Input value={account} onChange={e => { setAccount(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.account; return n; }); }} placeholder="Enter account number" className={`h-11 ${errClass("account")}`} />
                {fieldErrors.account && <p className="text-[11px] text-destructive font-medium">{fieldErrors.account}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={fieldErrors.amount ? "text-destructive" : ""}>Amount (৳) *</Label>
                <Input value={amount} onChange={e => { setAmount(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.amount; return n; }); }} placeholder="Enter amount" type="number" className={`h-11 ${errClass("amount")}`} />
                {fieldErrors.amount && <p className="text-[11px] text-destructive font-medium">{fieldErrors.amount}</p>}
              </div>
              <Separator />
              {amount && Number(amount) > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bill Amount</span><span className="font-semibold">৳{Number(amount).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳10</span></div>
                  <Separator />
                  <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳{(Number(amount) + 10).toLocaleString()}</span></div>
                </div>
              )}
              <Button onClick={handleSubmit} className="w-full h-12 font-bold" disabled={submitBill.isPending}>
                <CreditCard className="w-5 h-5 mr-2" /> {submitBill.isPending ? "Processing..." : "Pay Bill"}
              </Button>
            </CardContent>
          </Card>
        </DataLoader>
      </div>
    </div>
  );
};

export default PayBillPage;
