import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Check, Shield } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthGateModal from "@/components/AuthGateModal";

const ESIMPurchase = () => {
  const [searchParams] = useSearchParams();
  const country = searchParams.get("country") || "Thailand";
  const plan = searchParams.get("plan") || "3 GB";
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: page, isLoading } = useCmsPageContent("/esim/purchase");
  const config = page?.bookingConfig;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setFieldErrors(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const fields = config?.steps?.[0]?.fields || [];
    fields.filter((f: any) => f.visible && f.required).forEach((f: any) => {
      if (!formData[f.id]?.trim()) errors[f.id] = `${f.label} is required`;
      if (f.type === "email" && formData[f.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[f.id])) {
        errors[f.id] = "Invalid email format";
      }
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: "Missing Information", description: Object.values(errors)[0], variant: "destructive" });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleFinalAction = async () => {
    if (!validateForm()) return;
    if (!isAuthenticated) { setAuthOpen(true); return; }
    try {
      const result: any = await api.post('/esim/purchase', {
        country, plan, formData, activation: searchParams.get("activation") || '',
        amount: config?.totalAmount || 0,
      });
      navigate("/booking/confirmation", {
        state: { booking: { type: "eSIM", bookingRef: result.bookingRef || result.id, route: `${country} — ${plan}`, baseFare: config?.totalAmount || 0, total: config?.totalAmount || 0, paymentMethod: "Pending" } },
      });
    } catch (err: any) {
      toast({ title: "Purchase Failed", description: err?.message || "Could not complete purchase", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;
  }

  const fields = config?.steps?.[0]?.fields || [];

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Smartphone className="w-6 h-6 text-primary" /> {page?.pageTitle || "Purchase eSIM"}</h1>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-lg">{config?.steps?.[0]?.label || "Your Details"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {fields.filter((f: any) => f.visible).map((f: any) => {
                    const hasError = !!fieldErrors[f.id];
                    return (
                      <div key={f.id} className={`space-y-1.5 ${!f.halfWidth ? "sm:col-span-2" : ""}`}>
                        <Label className={hasError ? "text-destructive" : ""}>{f.label}{f.required ? " *" : ""}</Label>
                        <Input type={f.type} placeholder={f.placeholder} className={`h-11 ${hasError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
                          value={formData[f.id] || ""} onChange={e => updateField(f.id, e.target.value)} />
                        {hasError && <p className="text-[11px] text-destructive font-medium">{fieldErrors[f.id]}</p>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full h-12 font-bold shadow-lg shadow-primary/20" onClick={handleFinalAction}>
              <Shield className="w-4 h-4 mr-1" /> {config?.submitButtonText || "Complete Purchase"}
            </Button>
          </div>

          <div className="md:col-span-2">
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">{config?.summaryTitle || "Order Summary"}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="text-center p-4 bg-primary/5 rounded-xl">
                  <Badge className="mb-2">{country}</Badge>
                  <h3 className="text-2xl font-black">{plan}</h3>
                  <p className="text-muted-foreground">15 Days</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> 4G/5G Speed</div>
                  <div className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> Instant QR Delivery</div>
                  <div className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> No Physical SIM</div>
                </div>
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">{config?.totalLabel}</span><span className="font-black text-primary">৳{config?.totalAmount?.toLocaleString()}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); navigate("/booking/confirmation", { state: { booking: { type: "eSIM", route: `${country} — ${plan}`, total: config?.totalAmount || 0 } } }); }} title="Sign in to purchase eSIM" />
    </div>
  );
};

export default ESIMPurchase;
