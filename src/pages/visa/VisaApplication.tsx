import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Globe, FileText, Upload, CheckCircle2, ArrowRight, Shield, User, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const requiredDocs = [
  "Valid passport (min 6 months validity)",
  "Recent passport-size photo (white background)",
  "Bank statement (last 6 months)",
  "Hotel booking confirmation",
  "Return flight ticket",
  "No Objection Certificate (if employed)",
  "Business registration (if self-employed)",
];

const VisaApplication = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Visa Details", "Personal Info", "Documents", "Review"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < 3 && <div className="w-6 sm:w-12 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {step === 1 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Visa Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Destination Country</Label>
                      <Select defaultValue="thailand"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="thailand">🇹🇭 Thailand</SelectItem><SelectItem value="malaysia">🇲🇾 Malaysia</SelectItem><SelectItem value="singapore">🇸🇬 Singapore</SelectItem><SelectItem value="uae">🇦🇪 UAE</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Visa Type</Label>
                      <Select defaultValue="tourist"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="tourist">Tourist</SelectItem><SelectItem value="business">Business</SelectItem><SelectItem value="medical">Medical</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Travel Date</Label><Input type="date" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Return Date</Label><Input type="date" className="h-11" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Number of Travellers</Label><Input type="number" defaultValue={1} min={1} className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Processing Type</Label>
                      <Select defaultValue="normal"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="normal">Normal (5-7 days)</SelectItem><SelectItem value="express">Express (2-3 days)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {step === 3 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Required Documents</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-xl mb-4">
                    <p className="text-xs text-muted-foreground">Upload all required documents in JPG, PNG, or PDF format. Max 5MB each.</p>
                  </div>
                  {requiredDocs.map((doc, i) => (
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

            {step === 4 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Review & Submit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                    <p className="text-sm font-medium text-success flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> All information verified. Ready to submit.</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-semibold">🇹🇭 Thailand</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Visa Type</span><span className="font-semibold">Tourist</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span className="font-semibold">Normal (5-7 days)</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Travellers</span><span className="font-semibold">1</span></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="visa-agree" className="mt-0.5" />
                    <label htmlFor="visa-agree" className="text-xs text-muted-foreground">
                      I confirm all information is accurate and I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="font-bold shadow-lg shadow-primary/20">
                  <Shield className="w-4 h-4 mr-1" /> Submit Application & Pay ৳4,500
                </Button>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">Application Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Visa Fee</span><span className="font-semibold">৳3,500</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳1,000</span></div>
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳4,500</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <Clock className="w-3.5 h-3.5" /> Estimated processing: 5-7 business days
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaApplication;
