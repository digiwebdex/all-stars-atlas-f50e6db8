import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PhoneCall, Zap, CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRechargeOperators, useSubmitRecharge } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const RechargePage = () => {
  const [searchParams] = useSearchParams();
  const [operator, setOperator] = useState(searchParams.get("operator") || "");
  const [number, setNumber] = useState(searchParams.get("number") || "");
  const [amount, setAmount] = useState(searchParams.get("amount") || "");
  const [rechargeType, setRechargeType] = useState(searchParams.get("type") || "prepaid");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { data: operatorsData, isLoading, error, refetch } = useRechargeOperators();
  const submitRecharge = useSubmitRecharge();

  const operators = (operatorsData as any)?.data || (operatorsData as any)?.operators || [];

  const handleSubmit = async () => {
    if (!operator || !number || !amount) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(number.replace(/[-\s]/g, ''))) {
      toast({ title: "Invalid Number", description: "Please enter a valid Bangladesh phone number (01XXX-XXXXXX)", variant: "destructive" });
      return;
    }
    if (Number(amount) < 10 || Number(amount) > 10000) {
      toast({ title: "Invalid Amount", description: "Amount must be between ৳10 and ৳10,000", variant: "destructive" });
      return;
    }
    try {
      await submitRecharge.mutateAsync({ operator, phoneNumber: number, amount: Number(amount), type: rechargeType } as any);
      setSubmitted(true);
      toast({ title: "Success", description: "Recharge submitted successfully!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Recharge failed", variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-success" /></div>
            <h2 className="text-xl font-bold">Recharge Successful!</h2>
            <p className="text-sm text-muted-foreground">৳{amount} has been recharged to {number}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSubmitted(false)}>Recharge Again</Button>
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
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><PhoneCall className="w-6 h-6 text-primary" /> Mobile Recharge</h1>
        <DataLoader isLoading={isLoading} error={error} skeleton="detail" retry={refetch}>
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex gap-2">
                {["prepaid", "postpaid"].map(t => (
                  <button key={t} onClick={() => setRechargeType(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${rechargeType === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select operator" /></SelectTrigger>
                  <SelectContent>
                    {operators.map((op: any) => <SelectItem key={op.id} value={op.id}>{op.logo} {op.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Phone Number</Label><Input value={number} onChange={e => setNumber(e.target.value)} placeholder="01XXX-XXXXXX" className="h-11" /></div>
              <div className="space-y-1.5"><Label>Amount (৳)</Label><Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" type="number" className="h-11" /></div>
              <div className="flex flex-wrap gap-2">
                {[20, 50, 100, 200, 500, 1000].map(amt => (
                  <button key={amt} onClick={() => setAmount(String(amt))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${amount === String(amt) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>৳{amt}</button>
                ))}
              </div>
              <Separator />
              {amount && <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳{Number(amount).toLocaleString()}</span></div>}
              <Button onClick={handleSubmit} className="w-full h-12 font-bold" disabled={submitRecharge.isPending}>
                <Zap className="w-5 h-5 mr-2" /> {submitRecharge.isPending ? "Processing..." : "Recharge Now"}
              </Button>
            </CardContent>
          </Card>
        </DataLoader>
      </div>
    </div>
  );
};

export default RechargePage;
