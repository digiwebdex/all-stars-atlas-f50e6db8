import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (!agreed) {
      toast({ title: "Error", description: "Please agree to the Terms & Privacy Policy", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register({ firstName, lastName, email, phone, password });
      toast({ title: "Account Created!", description: "Welcome to Seven Trip" });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[hsl(167,72%,41%)] to-[hsl(217,91%,50%)] items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0VjBoLTJWMTRIMjBWMGgtMnYxNEgwdjJoMTR2MTRIMHYyaDE0djE0aDJ2LTE0aDE0djE0aDJ2LTE0aDE0di0ySDM2VjE2aDEydi0ySDM2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative text-white max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <h2 className="text-3xl font-black mb-4 leading-tight">Start Your Journey With Us Today</h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">Join 500,000+ travellers who trust Seven Trip for their travel needs.</p>
          <div className="space-y-3">
            {["No booking fees ever", "Exclusive member-only deals", "Save traveller profiles for faster booking", "Track all bookings in one place"].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                <CheckCircle2 className="w-4 h-4 text-secondary" />{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-9 w-auto" />
            </Link>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Start booking with Seven Trip today</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="John" className="pl-10 h-11" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" className="h-11" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@example.com" className="pl-10 h-11" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="tel" placeholder="+880 1XXX-XXXXXX" className="pl-10 h-11" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className="pl-10 pr-10 h-11" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox id="terms" className="mt-0.5" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the <Link to="/terms" className="text-primary font-medium hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative my-4">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">or sign up with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 font-medium" onClick={() => toast({ title: "Coming Soon", description: "Google sign-up will be available soon." })}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <Button variant="outline" className="h-11 font-medium" onClick={() => toast({ title: "Coming Soon", description: "Facebook sign-up will be available soon." })}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground pt-4">
              Already have an account? <Link to="/auth/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
