import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import AuthGateModal from "@/components/AuthGateModal";

const ESIMPurchase = () => {
  const [searchParams] = useSearchParams();
  const country = searchParams.get("country") || "Thailand";
  const plan = searchParams.get("plan") || "3 GB";
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: page, isLoading } = useCmsPageContent("/esim/purchase");
  const config = page?.bookingConfig;

  const handleFinalAction = () => {
    if (!isAuthenticated) { setAuthOpen(true); return; }
    navigate("/booking/confirmation");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;
  }

  const fields = config?.steps?.[0]?.fields || [];

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Smartphone className="w-6 h-6 text-primary" /> {page?.pageTitle || "Purchase eSIM"}</h1>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-lg">{config?.steps?.[0]?.label || "Your Details"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {fields.filter(f => f.visible).map(f => (
                    <div key={f.id} className={`space-y-1.5 ${!f.halfWidth ? "sm:col-span-2" : ""}`}>
                      <Label>{f.label}</Label>
                      <Input type={f.type} placeholder={f.placeholder} className="h-11" />
                    </div>
                  ))}
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

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); navigate("/booking/confirmation"); }} title="Sign in to purchase eSIM" />
    </div>
  );
};

export default ESIMPurchase;
