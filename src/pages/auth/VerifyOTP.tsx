import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const VerifyOTP = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"otp" | "reset">("otp");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { verifyOtp, resetPassword, forgotPassword } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    try {
      await forgotPassword(email);
      toast({ title: "OTP Resent", description: "A new verification code has been sent to your email" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to resend OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast({ title: "Error", description: "Please enter the complete 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const resetToken = await verifyOtp(email, code);
      setVerifiedToken(resetToken);
      setStep("reset");
      toast({ title: "Verified", description: "OTP verified successfully. Set your new password." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Invalid OTP. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(verifiedToken, newPassword);
      toast({ title: "Success", description: "Password reset successfully. Please login." });
      navigate("/auth/login");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to reset password. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="flex justify-center mb-4">
            <img src="/images/seven-trip-logo.png" alt="Seven Trip" className="h-24 w-auto" />
          </Link>
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">{step === "otp" ? "Verify OTP" : "Reset Password"}</CardTitle>
          {step === "otp" && (
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <Input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-black"
                    maxLength={1}
                    inputMode="numeric"
                  />
                ))}
              </div>
              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? "Verifying..." : "Verify"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code? <button type="button" onClick={handleResendOtp} className="text-primary font-semibold hover:underline">Resend</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" placeholder="Minimum 8 characters" className="h-11" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Re-enter password" className="h-11" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/auth/login" className="text-primary font-semibold hover:underline">Back to Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOTP;