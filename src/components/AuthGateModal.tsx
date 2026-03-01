import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: () => void;
  title?: string;
  description?: string;
}

const AuthGateModal = ({ open, onOpenChange, onAuthenticated, title, description }: AuthGateModalProps) => {
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // If already authenticated, proceed immediately
  if (isAuthenticated && open) {
    setTimeout(() => onAuthenticated(), 0);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Required", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        if (!firstName || !lastName) {
          toast({ title: "Required", description: "Please enter your name.", variant: "destructive" });
          setLoading(false);
          return;
        }
        await register({ firstName, lastName, email, phone, password });
      }
      toast({ title: "Success", description: mode === "login" ? "Logged in successfully!" : "Account created successfully!" });
      onAuthenticated();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Authentication failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            {title || "Sign in to continue"}
          </DialogTitle>
          <DialogDescription>
            {description || "Please sign in or create an account to complete your booking. Your data will be saved to your account."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gate-fn">First Name</Label>
                <Input id="gate-fn" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gate-ln">Last Name</Label>
                <Input id="gate-ln" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="h-11" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="gate-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input id="gate-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 pl-9" />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="gate-phone">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <Input id="gate-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" className="h-11 pl-9" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="gate-password">Password</Label>
            <div className="relative">
              <Input id="gate-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
          </Button>
        </form>

        <Separator />
        <p className="text-xs text-center text-muted-foreground">
          Your booking details are saved. {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary font-medium hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;
