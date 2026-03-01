import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, FileText, Upload, CheckCircle2, ArrowRight, Shield, User, Clock } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import { useCmsPageContent } from "@/hooks/useCmsContent";

const VisaApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const { data: page, isLoading } = useCmsPageContent("/visa/apply");
  const config = page?.visaConfig;

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country")?.toLowerCase() || "thailand");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "Tourist");
  const [processingType, setProcessingType] = useState("normal");
  const [travellers, setTravellers] = useState(1);

  const countries = useMemo(() => config?.countries?.filter(c => c.active) || [], [config]);
  const country = useMemo(() => countries.find(c => c.code === selectedCountry), [countries, selectedCountry]);
  const processingOption = useMemo(() => country?.processingOptions.find(p => p.label.toLowerCase() === processingType), [country, processingType]);
  const steps = config?.formSteps || [{ label: "Visa Details" }, { label: "Personal Info" }, { label: "Documents" }, { label: "Review" }];

  const baseFee = country?.baseFee || 0;
  const serviceFee = country?.serviceFee || 0;
  const expressExtra = processingOption?.extraFee || 0;
  const totalPerPerson = baseFee + serviceFee + expressExtra;
  const grandTotal = totalPerPerson * travellers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
        <div className="container mx-auto px-4 space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-6 sm:w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1: Visa Details */}
            {step === 1 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Visa Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Destination Country</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Visa Type</Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(country?.visaTypes || []).map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Travel Date</Label><Input type="date" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Return Date</Label><Input type="date" className="h-11" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Number of Travellers</Label>
                      <Input type="number" value={travellers} onChange={e => setTravellers(Math.max(1, Number(e.target.value)))} min={1} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Processing Type</Label>
                      <Select value={processingType} onValueChange={setProcessingType}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(country?.processingOptions || []).map(p => (
                            <SelectItem key={p.label.toLowerCase()} value={p.label.toLowerCase()}>
                              {p.label} ({p.days}){p.extraFee > 0 ? ` +৳${p.extraFee.toLocaleString()}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Applicant Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label>First Name</Label><Input placeholder="As per passport" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Last Name</Label><Input placeholder="As per passport" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" className="h-11" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Passport Number</Label><Input placeholder="A12345678" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Passport Expiry</Label><Input type="date" className="h-11" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Email</Label><Input type="email" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" className="h-11" /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Current Address</Label><Textarea placeholder="Full address" rows={3} /></div>
                  <div className="space-y-1.5"><Label>Occupation</Label><Input className="h-11" /></div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Required Documents</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-xs text-muted-foreground">Upload all required documents in JPG, PNG, or PDF format. Max 5MB each.</p>
                  </div>
                  {(country?.requiredDocs || []).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        {doc}
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Review & Submit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                    <p className="text-sm font-medium text-success flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> All information verified. Ready to submit.</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-semibold">{country?.flag} {country?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Visa Type</span><span className="font-semibold">{selectedType}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span className="font-semibold">{processingOption?.label} ({processingOption?.days})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Travellers</span><span className="font-semibold">{travellers}</span></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="visa-agree" className="mt-0.5" />
                    <label htmlFor="visa-agree" className="text-xs text-muted-foreground">
                      {config?.termsText?.split("Terms & Conditions")[0]}
                      <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < steps.length ? (
                <Button onClick={() => setStep(step + 1)} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" onClick={() => {
                  if (!isAuthenticated) { setAuthOpen(true); return; }
                  navigate("/booking/confirmation");
                }}>
                  <Shield className="w-4 h-4 mr-1" /> Submit Application & Pay ৳{grandTotal.toLocaleString()}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar summary */}
          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">Application Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-semibold">{country?.flag} {country?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Visa Fee</span><span className="font-semibold">৳{baseFee.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳{serviceFee.toLocaleString()}</span></div>
                {expressExtra > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Express Fee</span><span className="font-semibold">৳{expressExtra.toLocaleString()}</span></div>
                )}
                {travellers > 1 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Travellers</span><span className="font-semibold">×{travellers}</span></div>
                )}
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳{grandTotal.toLocaleString()}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <Clock className="w-3.5 h-3.5" /> {processingOption?.days ? `Estimated processing: ${processingOption.days}` : config?.estimatedProcessingNote}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); navigate("/booking/confirmation"); }} title="Sign in to apply for visa" />
    </div>
  );
};

export default VisaApplication;
