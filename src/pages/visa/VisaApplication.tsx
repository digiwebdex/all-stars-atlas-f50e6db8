import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { config } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Globe, FileText, Upload, CheckCircle2, ArrowRight, Shield, User, Clock, Phone, MapPin, Briefcase, Heart, AlertTriangle, X, Loader2, File } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import { useCmsPageContent } from "@/hooks/useCmsContent";

interface UploadedDoc {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  label: string;
}

const VisaApplication = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: page, isLoading } = useCmsPageContent("/visa/apply");
  const visaConfig = page?.visaConfig;

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country")?.toLowerCase() || "thailand");
  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "Tourist");
  const [processingType, setProcessingType] = useState("normal");
  const [travellers, setTravellers] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Document uploads
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // All form data
  const [form, setForm] = useState({
    firstName: "", lastName: "", dob: "", gender: "", nationality: "Bangladeshi",
    nidNumber: "", tinNumber: "",
    passportNumber: "", passportExpiry: "", passportIssueDate: "", passportIssuePlace: "",
    email: "", phone: "", altPhone: "",
    currentAddress: "", permanentAddress: "",
    occupation: "", employer: "", monthlyIncome: "",
    fatherName: "", motherName: "", spouseName: "",
    emergencyContact: "", emergencyPhone: "", emergencyRelation: "",
    travelDate: "", returnDate: "", previousVisits: "", purposeOfVisit: "",
    hotelName: "", hotelAddress: "",
    notes: "",
  });

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => { const n = {...prev}; delete n[field]; return n; });
  };

  const countries = useMemo(() => visaConfig?.countries?.filter((c: any) => c.active) || [], [visaConfig]);
  const country = useMemo(() => countries.find((c: any) => c.code === selectedCountry), [countries, selectedCountry]);
  const processingOption = useMemo(() => country?.processingOptions.find((p: any) => p.label.toLowerCase() === processingType), [country, processingType]);
  const steps = visaConfig?.formSteps || [{ label: "Visa Details" }, { label: "Personal Info" }, { label: "Documents" }, { label: "Review" }];

  const baseFee = country?.baseFee || 0;
  const serviceFee = country?.serviceFee || 0;
  const expressExtra = processingOption?.extraFee || 0;
  const totalPerPerson = baseFee + serviceFee + expressExtra;
  const grandTotal = totalPerPerson * travellers;

  /** Step validation */
  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.travelDate) errors.travelDate = "Travel date is required";
      if (!form.returnDate) errors.returnDate = "Return date is required";
      if (!form.purposeOfVisit?.trim()) errors.purposeOfVisit = "Purpose of visit is required";
      if (form.travelDate && form.returnDate && new Date(form.returnDate) <= new Date(form.travelDate)) {
        errors.returnDate = "Return date must be after travel date";
      }
      if (form.travelDate && new Date(form.travelDate) <= new Date()) {
        errors.travelDate = "Travel date must be in the future";
      }
    }

    if (currentStep === 2) {
      if (!form.firstName?.trim()) errors.firstName = "First name is required";
      if (!form.lastName?.trim()) errors.lastName = "Last name is required";
      if (!form.dob) errors.dob = "Date of birth is required";
      if (!form.gender) errors.gender = "Gender is required";
      if (!form.passportNumber?.trim()) errors.passportNumber = "Passport number is required";
      if (!form.passportExpiry) errors.passportExpiry = "Passport expiry is required";
      if (!form.email?.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email format";
      if (!form.phone?.trim()) errors.phone = "Phone number is required";
      if (!form.currentAddress?.trim()) errors.currentAddress = "Current address is required";
      if (!form.occupation?.trim()) errors.occupation = "Occupation is required";
      if (!form.emergencyContact?.trim()) errors.emergencyContact = "Emergency contact name is required";
      if (!form.emergencyPhone?.trim()) errors.emergencyPhone = "Emergency phone is required";
      // Passport expiry must be > 6 months from travel
      if (form.passportExpiry && form.travelDate) {
        const expiry = new Date(form.passportExpiry);
        const travel = new Date(form.travelDate);
        const sixMonths = new Date(travel.getTime() + 180 * 24 * 60 * 60 * 1000);
        if (expiry < sixMonths) errors.passportExpiry = "Passport must be valid for 6+ months from travel date";
      }
      if (form.dob) {
        const dobDate = new Date(form.dob);
        if (dobDate >= new Date()) errors.dob = "Date of birth must be in the past";
      }
    }

    if (currentStep === 3) {
      const requiredDocs = country?.requiredDocs || [];
      const missingDocs = requiredDocs.filter((d: string) => !uploadedDocs.find(u => u.label === d));
      if (missingDocs.length > 0) {
        errors._docs = `Please upload: ${missingDocs.join(", ")}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      toast({ title: "Missing Information", description: firstError, variant: "destructive" });
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // File upload handler
  const handleFileUpload = async (docLabel: string, file: globalThis.File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setUploading(prev => ({ ...prev, [docLabel]: true }));
    try {
      const formData = new FormData();
      formData.append('documents', file);
      const apiBase = config.apiBaseUrl;
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBase}/visa/upload-documents`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      if (result.files && result.files.length > 0) {
        const uploaded = result.files[0];
        setUploadedDocs(prev => [...prev.filter(d => d.label !== docLabel), { ...uploaded, label: docLabel }]);
        toast({ title: "Uploaded", description: `${docLabel} uploaded successfully.` });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err?.message || "Could not upload file.", variant: "destructive" });
    } finally {
      setUploading(prev => ({ ...prev, [docLabel]: false }));
    }
  };

  const removeDoc = (docLabel: string) => setUploadedDocs(prev => prev.filter(d => d.label !== docLabel));
  const getDocForLabel = (label: string) => uploadedDocs.find(d => d.label === label);
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const errClass = (field: string) => fieldErrors[field] ? "border-destructive ring-destructive/20 ring-2" : "";
  const errLabel = (field: string) => fieldErrors[field] ? "text-destructive" : "";
  const errMsg = (field: string) => fieldErrors[field] ? <p className="text-[11px] text-destructive font-medium">{fieldErrors[field]}</p> : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
        <div className="container mx-auto px-4 space-y-6">
          <Skeleton className="h-10 w-64 mx-auto" />
          <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Skeleton className="h-96 w-full rounded-xl" /></div><Skeleton className="h-48 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-10">
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
                        <SelectContent>{countries.map((c: any) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Visa Type <span className="text-destructive">*</span></Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>{(country?.visaTypes || []).map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={errLabel("travelDate")}>Travel Date <span className="text-destructive">*</span></Label>
                      <Input type="date" className={`h-11 ${errClass("travelDate")}`} value={form.travelDate} onChange={e => updateForm("travelDate", e.target.value)} />
                      {errMsg("travelDate")}
                    </div>
                    <div className="space-y-1.5">
                      <Label className={errLabel("returnDate")}>Return Date <span className="text-destructive">*</span></Label>
                      <Input type="date" className={`h-11 ${errClass("returnDate")}`} value={form.returnDate} onChange={e => updateForm("returnDate", e.target.value)} />
                      {errMsg("returnDate")}
                    </div>
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
                        <SelectContent>{(country?.processingOptions || []).map((p: any) => <SelectItem key={p.label.toLowerCase()} value={p.label.toLowerCase()}>{p.label} ({p.days}){p.extraFee > 0 ? ` +৳${p.extraFee.toLocaleString()}` : ""}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Travel Purpose & Accommodation</p>
                  <div className="space-y-1.5">
                    <Label className={errLabel("purposeOfVisit")}>Purpose of Visit <span className="text-destructive">*</span></Label>
                    <Textarea placeholder="e.g., Tourism - visiting Bangkok and Pattaya" rows={2} value={form.purposeOfVisit} onChange={e => updateForm("purposeOfVisit", e.target.value)} className={errClass("purposeOfVisit")} />
                    {errMsg("purposeOfVisit")}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Hotel / Accommodation Name</Label><Input placeholder="e.g., Grand Hyatt" className="h-11" value={form.hotelName} onChange={e => updateForm("hotelName", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Hotel Address</Label><Input placeholder="Full address" className="h-11" value={form.hotelAddress} onChange={e => updateForm("hotelAddress", e.target.value)} /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Previous Country Visits</Label><Input placeholder="e.g., Malaysia (2024), India (2023)" className="h-11" value={form.previousVisits} onChange={e => updateForm("previousVisits", e.target.value)} /></div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-5">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className={errLabel("firstName")}>First Name <span className="text-destructive">*</span></Label><Input placeholder="As per passport" className={`h-11 ${errClass("firstName")}`} value={form.firstName} onChange={e => updateForm("firstName", e.target.value)} />{errMsg("firstName")}</div>
                      <div className="space-y-1.5"><Label className={errLabel("lastName")}>Last Name <span className="text-destructive">*</span></Label><Input placeholder="As per passport" className={`h-11 ${errClass("lastName")}`} value={form.lastName} onChange={e => updateForm("lastName", e.target.value)} />{errMsg("lastName")}</div>
                      <div className="space-y-1.5"><Label className={errLabel("dob")}>Date of Birth <span className="text-destructive">*</span></Label><Input type="date" className={`h-11 ${errClass("dob")}`} value={form.dob} onChange={e => updateForm("dob", e.target.value)} />{errMsg("dob")}</div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className={errLabel("gender")}>Gender <span className="text-destructive">*</span></Label>
                        <Select value={form.gender} onValueChange={v => updateForm("gender", v)}>
                          <SelectTrigger className={`h-11 ${errClass("gender")}`}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                        </Select>
                        {errMsg("gender")}
                      </div>
                      <div className="space-y-1.5"><Label>Nationality</Label><Input className="h-11" value={form.nationality} onChange={e => updateForm("nationality", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>NID Number</Label><Input placeholder="National ID number" className="h-11" value={form.nidNumber} onChange={e => updateForm("nidNumber", e.target.value)} /></div>
                    </div>
                    <div className="space-y-1.5"><Label>TIN Number (if applicable)</Label><Input placeholder="Tax Identification Number" className="h-11" value={form.tinNumber} onChange={e => updateForm("tinNumber", e.target.value)} /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Passport Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className={errLabel("passportNumber")}>Passport Number <span className="text-destructive">*</span></Label><Input placeholder="A12345678" className={`h-11 ${errClass("passportNumber")}`} value={form.passportNumber} onChange={e => updateForm("passportNumber", e.target.value)} />{errMsg("passportNumber")}</div>
                      <div className="space-y-1.5"><Label className={errLabel("passportExpiry")}>Passport Expiry <span className="text-destructive">*</span></Label><Input type="date" className={`h-11 ${errClass("passportExpiry")}`} value={form.passportExpiry} onChange={e => updateForm("passportExpiry", e.target.value)} />{errMsg("passportExpiry")}</div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" className="h-11" value={form.passportIssueDate} onChange={e => updateForm("passportIssueDate", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Place of Issue</Label><Input placeholder="e.g., Dhaka" className="h-11" value={form.passportIssuePlace} onChange={e => updateForm("passportIssuePlace", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Contact Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className={errLabel("email")}>Email <span className="text-destructive">*</span></Label><Input type="email" className={`h-11 ${errClass("email")}`} value={form.email} onChange={e => updateForm("email", e.target.value)} />{errMsg("email")}</div>
                      <div className="space-y-1.5"><Label className={errLabel("phone")}>Phone <span className="text-destructive">*</span></Label><Input type="tel" placeholder="+880XXXXXXXXXX" className={`h-11 ${errClass("phone")}`} value={form.phone} onChange={e => updateForm("phone", e.target.value)} />{errMsg("phone")}</div>
                    </div>
                    <div className="space-y-1.5"><Label>Alternative Phone</Label><Input type="tel" className="h-11" value={form.altPhone} onChange={e => updateForm("altPhone", e.target.value)} /></div>
                    <div className="space-y-1.5"><Label className={errLabel("currentAddress")}>Current Address <span className="text-destructive">*</span></Label><Textarea placeholder="Full current address" rows={2} value={form.currentAddress} onChange={e => updateForm("currentAddress", e.target.value)} className={errClass("currentAddress")} />{errMsg("currentAddress")}</div>
                    <div className="space-y-1.5"><Label>Permanent Address</Label><Textarea placeholder="If different from current address" rows={2} value={form.permanentAddress} onChange={e => updateForm("permanentAddress", e.target.value)} /></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Professional Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className={errLabel("occupation")}>Occupation <span className="text-destructive">*</span></Label><Input className={`h-11 ${errClass("occupation")}`} value={form.occupation} onChange={e => updateForm("occupation", e.target.value)} />{errMsg("occupation")}</div>
                      <div className="space-y-1.5"><Label>Employer / Company</Label><Input className="h-11" value={form.employer} onChange={e => updateForm("employer", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Monthly Income</Label><Input placeholder="e.g., ৳80,000" className="h-11" value={form.monthlyIncome} onChange={e => updateForm("monthlyIncome", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

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

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Emergency Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className={errLabel("emergencyContact")}>Contact Name <span className="text-destructive">*</span></Label><Input className={`h-11 ${errClass("emergencyContact")}`} value={form.emergencyContact} onChange={e => updateForm("emergencyContact", e.target.value)} />{errMsg("emergencyContact")}</div>
                      <div className="space-y-1.5"><Label className={errLabel("emergencyPhone")}>Contact Phone <span className="text-destructive">*</span></Label><Input type="tel" className={`h-11 ${errClass("emergencyPhone")}`} value={form.emergencyPhone} onChange={e => updateForm("emergencyPhone", e.target.value)} />{errMsg("emergencyPhone")}</div>
                      <div className="space-y-1.5"><Label>Relationship</Label><Input placeholder="e.g., Brother, Wife" className="h-11" value={form.emergencyRelation} onChange={e => updateForm("emergencyRelation", e.target.value)} /></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-1.5"><Label>Additional Notes / Special Requirements</Label><Textarea placeholder="Any additional information you'd like us to know..." rows={3} value={form.notes} onChange={e => updateForm("notes", e.target.value)} /></div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Documents — REAL UPLOAD */}
            {step === 3 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Required Documents</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-xs text-muted-foreground">Upload all required documents in JPG, PNG, PDF, DOC format. Max 10MB each.</p>
                  </div>
                  {fieldErrors._docs && (
                    <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <p className="text-xs text-destructive font-medium">{fieldErrors._docs}</p>
                    </div>
                  )}
                  {(country?.requiredDocs || []).map((doc: string, i: number) => {
                    const uploaded = getDocForLabel(doc);
                    const isUploading = uploading[doc];
                    return (
                      <div key={i} className="rounded-lg border border-border overflow-hidden">
                        <div className="flex items-center justify-between gap-3 p-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {uploaded ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <File className="w-5 h-5 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{doc}</p>
                              {uploaded && <p className="text-[11px] text-muted-foreground truncate">{uploaded.originalName} ({formatFileSize(uploaded.size)})</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {uploaded && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDoc(doc)}><X className="w-3.5 h-3.5" /></Button>}
                            <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" className="hidden" ref={el => { fileInputRefs.current[doc] = el; }} onChange={e => { const file = e.target.files?.[0]; if (file) handleFileUpload(doc, file); e.target.value = ''; }} />
                            <Button variant={uploaded ? "outline" : "default"} size="sm" className="shrink-0" disabled={isUploading} onClick={() => fileInputRefs.current[doc]?.click()}>
                              {isUploading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading...</> : uploaded ? <><Upload className="w-3.5 h-3.5 mr-1" /> Replace</> : <><Upload className="w-3.5 h-3.5 mr-1" /> Upload</>}
                            </Button>
                          </div>
                        </div>
                        {uploaded && uploaded.mimetype?.startsWith('image/') && (
                          <div className="px-3 pb-3"><img src={`${config.apiBaseUrl.replace('/api', '')}${uploaded.url}`} alt={doc} className="h-16 rounded border border-border object-cover" /></div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">{uploadedDocs.length} / {(country?.requiredDocs || []).length} uploaded</Badge>
                    {uploadedDocs.length === (country?.requiredDocs || []).length && <Badge className="text-xs bg-success/10 text-success border-success/30">All documents uploaded ✓</Badge>}
                  </div>
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

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Emergency Contact</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{form.emergencyContact || "—"} ({form.emergencyRelation || "—"})</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold">{form.emergencyPhone || "—"}</span></div>
                      </div>
                    </div>
                    <Separator />

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents ({uploadedDocs.length} uploaded)</p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedDocs.map((doc, i) => <Badge key={i} className="bg-success/10 text-success border-success/30 text-xs">{doc.label} ✓</Badge>)}
                        {(country?.requiredDocs || []).filter((d: string) => !getDocForLabel(d)).map((d: string, i: number) => <Badge key={i} variant="outline" className="text-xs text-warning border-warning/30">{d} — missing</Badge>)}
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
                <Button onClick={handleContinue} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20" disabled={!agreed || submitting} onClick={async () => {
                  if (!isAuthenticated) { setAuthOpen(true); return; }
                  setSubmitting(true);
                  try {
                    await api.post('/visa/apply', {
                      country: country?.name || selectedCountry,
                      visaType: selectedType,
                      processingFee: grandTotal,
                      documents: uploadedDocs.map(d => ({ filename: d.filename, originalName: d.originalName, size: d.size, mimetype: d.mimetype, label: d.label, url: d.url })),
                      applicantInfo: { ...form, selectedCountry, selectedType, processingType, travellers, countryName: country?.name, baseFee, serviceFee, expressExtra, grandTotal },
                    });
                    toast({ title: "Application Submitted", description: "Your visa application has been submitted successfully." });
                    navigate("/booking/confirmation", { state: { booking: { type: "Visa", route: `${country?.name} — ${selectedType} Visa`, baseFare: baseFee, taxes: serviceFee + expressExtra, total: grandTotal, paymentMethod: "Pending" } } });
                  } catch (err: any) {
                    toast({ title: "Submission Failed", description: err?.message || "Could not submit application. Please try again.", variant: "destructive" });
                  } finally { setSubmitting(false); }
                }}>
                  <Shield className="w-4 h-4 mr-1" /> {submitting ? "Submitting..." : `Submit Application & Pay ৳${grandTotal.toLocaleString()}`}
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
                {expressExtra > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Express Fee</span><span className="font-semibold">৳{expressExtra.toLocaleString()}</span></div>}
                {travellers > 1 && <div className="flex justify-between"><span className="text-muted-foreground">Travellers</span><span className="font-semibold">×{travellers}</span></div>}
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳{grandTotal.toLocaleString()}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3"><Clock className="w-3.5 h-3.5" /> {processingOption?.days ? `Estimated processing: ${processingOption.days}` : visaConfig?.estimatedProcessingNote}</div>
                {form.firstName && (
                  <><Separator /><div className="text-xs text-muted-foreground space-y-1"><p className="font-semibold text-foreground">{form.firstName} {form.lastName}</p>{form.passportNumber && <p>Passport: {form.passportNumber}</p>}{form.phone && <p>{form.phone}</p>}</div></>
                )}
                {uploadedDocs.length > 0 && (
                  <><Separator /><div className="text-xs"><p className="font-medium text-foreground mb-1">Documents</p>{uploadedDocs.map((d, i) => <p key={i} className="text-muted-foreground">✓ {d.label}</p>)}</div></>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={() => { setAuthOpen(false); }} title="Sign in to submit your visa application" description="Create an account or sign in to track your application status." />
    </div>
  );
};

export default VisaApplication;
