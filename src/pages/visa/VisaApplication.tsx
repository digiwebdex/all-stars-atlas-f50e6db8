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
import { Globe, FileText, Upload, CheckCircle2, ArrowRight, Shield, User, Clock, Phone, MapPin, Briefcase, Heart, AlertTriangle } from "lucide-react";
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
  const [agreed, setAgreed] = useState(false);

  // All form data in one state object
  const [form, setForm] = useState({
    // Personal Info
    firstName: "", lastName: "", dob: "", gender: "", nationality: "Bangladeshi",
    nidNumber: "", tinNumber: "",
    // Passport
    passportNumber: "", passportExpiry: "", passportIssueDate: "", passportIssuePlace: "",
    // Contact
    email: "", phone: "", altPhone: "",
    currentAddress: "", permanentAddress: "",
    // Professional
    occupation: "", employer: "", monthlyIncome: "",
    // Family
    fatherName: "", motherName: "", spouseName: "",
    // Emergency
    emergencyContact: "", emergencyPhone: "", emergencyRelation: "",
    // Travel
    travelDate: "", returnDate: "", previousVisits: "", purposeOfVisit: "",
    hotelName: "", hotelAddress: "",
    // Notes
    notes: "",
  });

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const countries = useMemo(() => config?.countries?.filter((c: any) => c.active) || [], [config]);
  const country = useMemo(() => countries.find((c: any) => c.code === selectedCountry), [countries, selectedCountry]);
  const processingOption = useMemo(() => country?.processingOptions.find((p: any) => p.label.toLowerCase() === processingType), [country, processingType]);
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
          {steps.map((s: any, i: number) => (
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
            {/* Step 1: Visa & Travel Details */}
            {step === 1 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Visa & Travel Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Destination Country <span className="text-destructive">*</span></Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {countries.map((c: any) => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Visa Type <span className="text-destructive">*</span></Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(country?.visaTypes || []).map((t: string) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Travel Date <span className="text-destructive">*</span></Label><Input type="date" className="h-11" value={form.travelDate} onChange={e => updateForm("travelDate", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Return Date <span className="text-destructive">*</span></Label><Input type="date" className="h-11" value={form.returnDate} onChange={e => updateForm("returnDate", e.target.value)} /></div>
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
                          {(country?.processingOptions || []).map((p: any) => (
                            <SelectItem key={p.label.toLowerCase()} value={p.label.toLowerCase()}>
                              {p.label} ({p.days}){p.extraFee > 0 ? ` +৳${p.extraFee.toLocaleString()}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Travel Purpose & Accommodation</p>
                  <div className="space-y-1.5"><Label>Purpose of Visit <span className="text-destructive">*</span></Label><Textarea placeholder="e.g., Tourism - visiting Bangkok and Pattaya" rows={2} value={form.purposeOfVisit} onChange={e => updateForm("purposeOfVisit", e.target.value)} /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Hotel / Accommodation Name</Label><Input placeholder="e.g., Grand Hyatt" className="h-11" value={form.hotelName} onChange={e => updateForm("hotelName", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Hotel Address</Label><Input placeholder="Full address" className="h-11" value={form.hotelAddress} onChange={e => updateForm("hotelAddress", e.target.value)} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Previous Country Visits</Label><Input placeholder="e.g., Malaysia (2024), India (2023)" className="h-11" value={form.previousVisits} onChange={e => updateForm("previousVisits", e.target.value)} /></div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Personal Info - COMPREHENSIVE */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Personal Details */}
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label>First Name <span className="text-destructive">*</span></Label><Input placeholder="As per passport" className="h-11" value={form.firstName} onChange={e => updateForm("firstName", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Last Name <span className="text-destructive">*</span></Label><Input placeholder="As per passport" className="h-11" value={form.lastName} onChange={e => updateForm("lastName", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Date of Birth <span className="text-destructive">*</span></Label><Input type="date" className="h-11" value={form.dob} onChange={e => updateForm("dob", e.target.value)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>Gender <span className="text-destructive">*</span></Label>
                        <Select value={form.gender} onValueChange={v => updateForm("gender", v)}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Nationality</Label><Input className="h-11" value={form.nationality} onChange={e => updateForm("nationality", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>NID Number</Label><Input placeholder="National ID number" className="h-11" value={form.nidNumber} onChange={e => updateForm("nidNumber", e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label>TIN Number (if applicable)</Label><Input placeholder="Tax Identification Number" className="h-11" value={form.tinNumber} onChange={e => updateForm("tinNumber", e.target.value)} /></div>
                  </CardContent>
                </Card>

                {/* Passport Details */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Passport Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Passport Number <span className="text-destructive">*</span></Label><Input placeholder="A12345678" className="h-11" value={form.passportNumber} onChange={e => updateForm("passportNumber", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Passport Expiry <span className="text-destructive">*</span></Label><Input type="date" className="h-11" value={form.passportExpiry} onChange={e => updateForm("passportExpiry", e.target.value)} /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" className="h-11" value={form.passportIssueDate} onChange={e => updateForm("passportIssueDate", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Place of Issue</Label><Input placeholder="e.g., Dhaka" className="h-11" value={form.passportIssuePlace} onChange={e => updateForm("passportIssuePlace", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Contact Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" className="h-11" value={form.email} onChange={e => updateForm("email", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Phone <span className="text-destructive">*</span></Label><Input type="tel" placeholder="+880XXXXXXXXXX" className="h-11" value={form.phone} onChange={e => updateForm("phone", e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label>Alternative Phone</Label><Input type="tel" className="h-11" value={form.altPhone} onChange={e => updateForm("altPhone", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Current Address <span className="text-destructive">*</span></Label><Textarea placeholder="Full current address" rows={2} value={form.currentAddress} onChange={e => updateForm("currentAddress", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Permanent Address</Label><Textarea placeholder="If different from current address" rows={2} value={form.permanentAddress} onChange={e => updateForm("permanentAddress", e.target.value)} /></div>
                  </CardContent>
                </Card>

                {/* Professional */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label>Occupation <span className="text-destructive">*</span></Label><Input className="h-11" value={form.occupation} onChange={e => updateForm("occupation", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Employer / Company</Label><Input className="h-11" value={form.employer} onChange={e => updateForm("employer", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Monthly Income</Label><Input placeholder="e.g., ৳80,000" className="h-11" value={form.monthlyIncome} onChange={e => updateForm("monthlyIncome", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Family */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Family Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label>Father's Name</Label><Input className="h-11" value={form.fatherName} onChange={e => updateForm("fatherName", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Mother's Name</Label><Input className="h-11" value={form.motherName} onChange={e => updateForm("motherName", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Spouse Name</Label><Input placeholder="If applicable" className="h-11" value={form.spouseName} onChange={e => updateForm("spouseName", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Emergency Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label>Contact Name <span className="text-destructive">*</span></Label><Input className="h-11" value={form.emergencyContact} onChange={e => updateForm("emergencyContact", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Contact Phone <span className="text-destructive">*</span></Label><Input type="tel" className="h-11" value={form.emergencyPhone} onChange={e => updateForm("emergencyPhone", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Relationship</Label><Input placeholder="e.g., Brother, Wife" className="h-11" value={form.emergencyRelation} onChange={e => updateForm("emergencyRelation", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-1.5"><Label>Additional Notes / Special Requirements</Label><Textarea placeholder="Any additional information you'd like us to know..." rows={3} value={form.notes} onChange={e => updateForm("notes", e.target.value)} /></div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Required Documents</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-xs text-muted-foreground">Upload all required documents in JPG, PNG, or PDF format. Max 5MB each.</p>
                  </div>
                  {(country?.requiredDocs || []).map((doc: string, i: number) => (
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
              <div className="space-y-5">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Review & Submit</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                      <p className="text-sm font-medium text-success flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Please review all information before submitting.</p>
                    </div>

                    {/* Visa Details Summary */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visa & Travel</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-semibold">{country?.flag} {country?.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Visa Type</span><span className="font-semibold">{selectedType}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span className="font-semibold">{processingOption?.label} ({processingOption?.days})</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Travel Dates</span><span className="font-semibold">{form.travelDate || "—"} → {form.returnDate || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Purpose</span><span className="font-semibold text-right max-w-[60%]">{form.purposeOfVisit || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Travellers</span><span className="font-semibold">{travellers}</span></div>
                      </div>
                    </div>
                    <Separator />

                    {/* Personal Summary */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal Information</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-semibold">{form.firstName} {form.lastName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">DOB / Gender</span><span className="font-semibold">{form.dob || "—"} / {form.gender || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Passport</span><span className="font-semibold">{form.passportNumber || "—"} (exp: {form.passportExpiry || "—"})</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-semibold">{form.email || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold">{form.phone || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Occupation</span><span className="font-semibold">{form.occupation || "—"}</span></div>
                      </div>
                    </div>
                    <Separator />

                    {/* Emergency */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emergency Contact</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{form.emergencyContact || "—"} ({form.emergencyRelation || "—"})</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold">{form.emergencyPhone || "—"}</span></div>
                      </div>
                    </div>

                    <Separator />
                    <div className="flex items-start gap-2">
                      <Checkbox id="visa-agree" className="mt-0.5" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                      <label htmlFor="visa-agree" className="text-xs text-muted-foreground">
                        I confirm all information is accurate and agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < steps.length ? (
                <Button onClick={() => setStep(step + 1)} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" disabled={!agreed} onClick={() => {
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
                {form.firstName && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">{form.firstName} {form.lastName}</p>
                      {form.passportNumber && <p>Passport: {form.passportNumber}</p>}
                      {form.phone && <p>{form.phone}</p>}
                    </div>
                  </>
                )}
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