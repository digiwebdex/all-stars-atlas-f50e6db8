import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, ArrowRight, User, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import type { BookingFormField } from "@/lib/cms-defaults";

const RenderField = ({ field }: { field: BookingFormField }) => {
  if (!field.visible) return null;
  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <Select><SelectTrigger className="h-11"><SelectValue placeholder={field.placeholder || "Select"} /></SelectTrigger>
          <SelectContent>{(field.options || []).map(o => <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label>{field.label}</Label>
      <Input type={field.type} placeholder={field.placeholder} className="h-11" />
    </div>
  );
};

const CarBooking = () => {
  const [step, setStep] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { data: page, isLoading } = useCmsPageContent("/cars/book");
  const config = page?.bookingConfig;
  const carId = searchParams.get("id");

  const handleFinalAction = () => {
    if (!isAuthenticated) { setAuthOpen(true); return; }
    navigate("/booking/confirmation", {
      state: {
        booking: {
          type: "Car Rental",
          route: `Car #${carId || "—"}`,
          baseFare: config?.totalAmount || 0,
          taxes: Math.round((config?.totalAmount || 0) * 0.05),
          total: Math.round((config?.totalAmount || 0) * 1.05),
          paymentMethod: "Pending",
        },
      },
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;
  }

  const steps = config?.steps || [];
  const totalSteps = steps.length;

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < totalSteps - 1 && <div className="w-8 sm:w-16 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {steps.map((formStep, si) => {
              if (step < si + 1 || formStep.fields.length === 0) return null;
              const Icon = si === 0 ? Car : User;
              return (
                <Card key={si}>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /> {formStep.label}</CardTitle></CardHeader>
                  <CardContent>
                    {si === 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl mb-4">
                        <h3 className="font-bold text-lg">Selected Vehicle</h3>
                        <p className="text-sm text-muted-foreground">Car ID: {carId || "—"}</p>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {formStep.fields.filter(f => f.visible).map(f => <RenderField key={f.id} field={f} />)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleFinalAction}>
                  <Shield className="w-4 h-4 mr-1" /> {config?.submitButtonText} ৳{config?.totalAmount?.toLocaleString()}
                </Button>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">{config?.summaryTitle}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(config?.summaryFields || []).map((f, i) => (
                  <div key={i} className="flex justify-between"><span className="text-muted-foreground">{f.label}</span><span className="font-semibold">{f.value}</span></div>
                ))}
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">{config?.totalLabel}</span><span className="font-black text-primary">৳{config?.totalAmount?.toLocaleString()}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); navigate("/booking/confirmation", { state: { booking: { type: "Car Rental", baseFare: config?.totalAmount || 0, total: Math.round((config?.totalAmount || 0) * 1.05) } } }); }} title="Sign in to book your car" />
    </div>
  );
};

export default CarBooking;
