import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plane, ArrowRight, User, Clock, Luggage, Shield, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const FlightBooking = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28 pb-10">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["Flight Details", "Passenger Info", "Review & Pay"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < 2 && <div className="w-8 sm:w-16 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Flight Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Plane className="w-5 h-5 text-primary" /> Flight Details</CardTitle>
                  <Badge className="bg-success/10 text-success text-xs">Confirmed Fare</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-2xl font-black">07:30</p>
                    <p className="text-xs font-semibold text-muted-foreground">DAC</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[11px] text-muted-foreground font-medium">1h 05m</p>
                    <div className="w-full flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full border-2 border-primary" />
                      <div className="flex-1 h-px bg-border" />
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <p className="text-[11px] text-success font-semibold">Non-stop</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">08:35</p>
                    <p className="text-xs font-semibold text-muted-foreground">CXB</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Luggage className="w-3.5 h-3.5" /> 20kg Checked</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Thu, 26 Feb 2026</span>
                  <span>Biman Bangladesh • BG-435 • Economy</span>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Form */}
            {step >= 2 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Passenger Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">Adult 1 (Primary Contact)</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Select defaultValue="mr"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="mr">Mr</SelectItem><SelectItem value="mrs">Mrs</SelectItem><SelectItem value="ms">Ms</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>First Name</Label><Input placeholder="As per passport" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Last Name</Label><Input placeholder="As per passport" className="h-11" /></div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Nationality</Label><Select defaultValue="bd"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bd">Bangladeshi</SelectItem><SelectItem value="in">Indian</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>Gender</Label><Select><SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="m">Male</SelectItem><SelectItem value="f">Female</SelectItem></SelectContent></Select></div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold">Passport Information</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label>Passport Number</Label><Input placeholder="A12345678" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Passport Expiry</Label><Input type="date" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Issuing Country</Label><Select defaultValue="bd"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bd">Bangladesh</SelectItem></SelectContent></Select></div>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground font-semibold">Contact Details</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="you@example.com" className="h-11" /></div>
                    <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" placeholder="+880 1XXX-XXXXXX" className="h-11" /></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review */}
            {step >= 3 && (
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {["bKash", "Nagad", "Visa/Master Card", "Bank Transfer"].map(m => (
                      <label key={m} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 cursor-pointer transition-colors">
                        <Checkbox />
                        <span className="text-sm font-medium">{m}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-3">
                    <Checkbox id="agree" className="mt-0.5" />
                    <label htmlFor="agree" className="text-xs text-muted-foreground">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> and <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="font-bold">Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button asChild className="font-bold shadow-lg shadow-primary/20">
                  <Link to="/booking/confirmation"><Shield className="w-4 h-4 mr-1" /> Confirm & Pay ৳4,200</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Price Summary Sidebar */}
          <div>
            <Card className="sticky top-28">
              <CardHeader><CardTitle className="text-base">Fare Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Base Fare (1 Adult)</span><span className="font-semibold">৳3,600</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxes & Fees</span><span className="font-semibold">৳500</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service Charge</span><span className="font-semibold">৳100</span></div>
                <Separator />
                <div className="flex justify-between text-base"><span className="font-bold">Total</span><span className="font-black text-primary">৳4,200</span></div>
                <div className="flex justify-between text-xs text-success"><span>You Save</span><span className="font-semibold">৳900</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBooking;
