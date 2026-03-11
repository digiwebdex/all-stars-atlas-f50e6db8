import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, ArrowRight, User, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthGateModal from "@/components/AuthGateModal";
import type { BookingFormField } from "@/lib/cms-defaults";

const MedicalBooking = () => {
  const [step, setStep] = useState(1);
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: page, isLoading } = useCmsPageContent("/medical/book");
  const config = page?.bookingConfig;
  const hospitalId = searchParams.get("hospital");

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    setFieldErrors(prev => { const n = {...prev}; delete n[id]; return n; });
  };

  const validateStep = (stepIndex: number): boolean => {
    const errors: Record<string, string> = {};
    const currentStepConfig = steps[stepIndex - 1];
    if (!currentStepConfig) return true;

    currentStepConfig.fields.filter((f: BookingFormField) => f.visible && f.required).forEach((f: BookingFormField) => {
      if (!formData[f.id]?.trim()) {
        errors[f.id] = `${f.label} is required`;
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

  const handleContinue = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleFinalAction = async () => {
    if (!isAuthenticated) { setAuthOpen(true); return; }
    try {
      const result: any = await api.post('/medical/book', {
        hospitalId, formData, totalAmount: config?.totalAmount || 0,
      });
      navigate("/booking/confirmation", {
        state: { booking: { type: "Medical", bookingRef: result.bookingRef || result.id, route: `Hospital #${hospitalId || "—"}`, baseFare: config?.totalAmount || 0, total: config?.totalAmount || 0, paymentMethod: "Pending" } },
      });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err?.message || "Could not complete booking", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10"><div className="container mx-auto px-4"><Skeleton className="h-96 w-full rounded-xl" /></div></div>;
  }

  const steps = config?.steps || [];
  const totalSteps = steps.length;

  const RenderField = ({ field }: { field: BookingFormField }) => {
    if (!field.visible) return null;
    const hasError = !!fieldErrors[field.id];
    if (field.type === "select") {
      return (
        <div className="space-y-1.5">
          <Label className={hasError ? "text-destructive" : ""}>{field.label}{field.required ? " *" : ""}</Label>
          <Select value={formData[field.id] || ""} onValueChange={v => updateField(field.id, v)}>
            <SelectTrigger className={`h-11 ${hasError ? "border-destructive ring-destructive/20 ring-2" : ""}`}><SelectValue placeholder={field.placeholder || "Select"} /></SelectTrigger>
            <SelectContent>{(field.options || []).map(o => <SelectItem key={o} value={o.toLowerCase()}>{o}</SelectItem>)}</SelectContent>
          </Select>
          {hasError && <p className="text-[11px] text-destructive font-medium">{fieldErrors[field.id]}</p>}
        </div>
      );
    }
    if (field.type === "textarea") {
      return (
        <div className="space-y-1.5 sm:col-span-2">
          <Label className={hasError ? "text-destructive" : ""}>{field.label}{field.required ? " *" : ""}</Label>
          <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
            placeholder={field.placeholder} value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)} />
          {hasError && <p className="text-[11px] text-destructive font-medium">{fieldErrors[field.id]}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-1.5">
        <Label className={hasError ? "text-destructive" : ""}>{field.label}{field.required ? " *" : ""}</Label>
        <Input type={field.type} placeholder={field.placeholder} className={`h-11 ${hasError ? "border-destructive ring-destructive/20 ring-2" : ""}`}
          value={formData[field.id] || ""} onChange={e => updateField(field.id, e.target.value)} />
        {hasError && <p className="text-[11px] text-destructive font-medium">{fieldErrors[field.id]}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s: any, i: number) => (
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
            {steps.map((formStep: any, si: number) => {
              if (step < si + 1 || formStep.fields.length === 0) return null;
              const Icon = si === 0 ? Stethoscope : User;
              return (
                <Card key={si}>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /> {formStep.label}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {formStep.fields.filter((f: BookingFormField) => f.visible).map((f: BookingFormField) => <RenderField key={f.id} field={f} />)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < totalSteps ? (
                <Button onClick={handleContinue} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={handleFinalAction}>
                  <Shield className="w-4 h-4 mr-1" /> {config?.submitButtonText}
                </Button>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">{config?.summaryTitle}</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(config?.summaryFields || []).map((f: any, i: number) => (
                  <div key={i} className="flex justify-between"><span className="text-muted-foreground">{f.label}</span><span className="font-semibold">{f.value}</span></div>
                ))}
                <Separator />
                {config?.note && <p className="text-xs text-muted-foreground">{config.note}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); navigate("/booking/confirmation", { state: { booking: { type: "Medical", route: `Hospital #${hospitalId || "—"}` } } }); }} title="Sign in to submit your enquiry" />
    </div>
  );
};

export default MedicalBooking;
