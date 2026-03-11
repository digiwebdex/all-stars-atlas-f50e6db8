/**
 * Passport Scanner — Upload, Camera capture, or drag-drop passport/NID image
 * Calls backend /api/passport/ocr endpoint for real text extraction via Google Vision
 */
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, ScanLine, CheckCircle2, Loader2, AlertCircle, Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ExtractedData {
  title: string;
  firstName: string;
  lastName: string;
  country: string;
  passportNumber: string;
  birthDate: string;
  birthPlace: string;
  gender: string;
  issuanceDate: string;
  expiryDate: string;
}

interface PassportScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ExtractedData) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_IMAGE_DIM = 400; // minimum pixels for quality check

/** Compress image to max dimensions and JPEG quality */
function compressImage(dataUrl: string, maxDim = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

/** Check image quality (dimensions) */
function checkImageQuality(dataUrl: string): Promise<{ ok: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        ok: img.width >= MIN_IMAGE_DIM && img.height >= MIN_IMAGE_DIM,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => resolve({ ok: false, width: 0, height: 0 });
    img.src = dataUrl;
  });
}

const PassportScanner = ({ open, onOpenChange, onConfirm }: PassportScannerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setQualityWarning(null);
    } catch {
      toast({ title: "Camera Error", description: "Could not access camera. Please check permissions.", variant: "destructive" });
    }
  }, [toast]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    // Quality check
    if (video.videoWidth < MIN_IMAGE_DIM || video.videoHeight < MIN_IMAGE_DIM) {
      setQualityWarning(`Low resolution (${video.videoWidth}×${video.videoHeight}). Move to better lighting and hold steady for clearer results.`);
    } else {
      setQualityWarning(null);
    }

    stopCamera();
    setPreview(dataUrl);

    // Create a file-like object for display
    const blob = await (await fetch(dataUrl)).blob();
    const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
    setFile(capturedFile);

    // Process OCR
    await processOCR(dataUrl);
  }, [stopCamera]);

  const processOCR = async (base64Data: string) => {
    setScanning(true);
    setExtracted(null);
    setOcrError(null);
    try {
      const result = await api.post<{
        success: boolean;
        extracted: ExtractedData;
        rawText?: string;
      }>("/passport/ocr", { image: base64Data });

      if (result.success && result.extracted) {
        setExtracted(result.extracted);
        const hasData = result.extracted.firstName || result.extracted.lastName || result.extracted.passportNumber;
        if (!hasData) {
          setOcrError("Could not extract text clearly. Please fill in the fields manually.");
        }
      } else {
        setOcrError("OCR could not process this image. Please try a clearer photo.");
        setExtracted(emptyExtracted());
      }
    } catch (err: any) {
      console.error("OCR error:", err);
      setOcrError(err?.message || "OCR service unavailable");
      setExtracted(emptyExtracted());
    } finally {
      setScanning(false);
    }
  };

  const handleFile = async (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast({ title: "Invalid File", description: "Upload JPG, PNG, WebP, or PDF only.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "File Too Large", description: "Max 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setOcrError(null);
    setQualityWarning(null);

    let base64Data = "";
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      const rawDataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(f);
      });
      setPreview(rawDataUrl);

      // Quality check
      const quality = await checkImageQuality(rawDataUrl);
      if (!quality.ok) {
        setQualityWarning(`Low resolution image (${quality.width}×${quality.height}px). For best results, use a well-lit, clear photo at least ${MIN_IMAGE_DIM}px.`);
      }

      base64Data = await compressImage(rawDataUrl, 1200, 0.7);
    } else {
      setPreview(null);
      const reader = new FileReader();
      base64Data = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(f);
      });
    }

    await processOCR(base64Data);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleConfirm = () => {
    if (!extracted) return;
    onConfirm(extracted);
    onOpenChange(false);
    resetState();
    toast({ title: "Data Applied", description: "Passport data has been filled into the form." });
  };

  const resetState = () => {
    stopCamera();
    setFile(null);
    setPreview(null);
    setExtracted(null);
    setScanning(false);
    setOcrError(null);
    setQualityWarning(null);
  };

  const updateField = (field: keyof ExtractedData, value: string) => {
    if (extracted) setExtracted({ ...extracted, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="w-5 h-5 text-accent" />
            Document Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Left: Upload / Camera / Preview */}
          <div className="p-5">
            {cameraActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border-2 border-accent/40 object-cover max-h-[400px] bg-black"
                />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <Button onClick={capturePhoto} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6">
                    <Camera className="w-5 h-5 mr-2" /> Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg" className="rounded-full">
                    <CameraOff className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
                {qualityWarning && (
                  <div className="absolute top-2 left-2 right-2 bg-warning/90 text-warning-foreground text-xs p-2 rounded-lg flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {qualityWarning}
                  </div>
                )}
              </div>
            ) : file && preview ? (
              <div className="relative">
                <img src={preview} alt="Document" className="w-full rounded-lg border-2 border-dashed border-accent/40 object-contain max-h-[400px]" />
                <button onClick={resetState} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
                {scanning && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-2" />
                      <p className="text-sm font-medium">Scanning with Google Vision...</p>
                    </div>
                  </div>
                )}
                {qualityWarning && !scanning && (
                  <div className="absolute bottom-2 left-2 right-2 bg-warning/90 text-warning-foreground text-xs p-2 rounded-lg flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {qualityWarning}
                  </div>
                )}
              </div>
            ) : file && !preview ? (
              <div className="border-2 border-dashed border-accent/40 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                {scanning && <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto mt-3" />}
                <button onClick={resetState} className="text-xs text-destructive hover:underline mt-3">Remove</button>
              </div>
            ) : (
              <div className="space-y-3">
                <label
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors min-h-[220px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Upload or drop your document</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Passport, NID, License — JPG, PNG, PDF — Max 10MB</p>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </label>
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </Button>
              </div>
            )}
          </div>

          {/* Right: Extracted Data */}
          <div className="p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">EXTRACTED DATA</h3>

            {ocrError && (
              <div className="flex items-start gap-2 p-3 mb-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{ocrError}</p>
              </div>
            )}

            {extracted ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input value={extracted.title} onChange={(e) => updateField("title", e.target.value)} placeholder="MR" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">First Name</Label>
                    <Input value={extracted.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Last Name</Label>
                    <Input value={extracted.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Country</Label>
                    <Input value={extracted.country} onChange={(e) => updateField("country", e.target.value)} placeholder="BD" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Passport Number</Label>
                    <Input value={extracted.passportNumber} onChange={(e) => updateField("passportNumber", e.target.value)} placeholder="" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Birth Date</Label>
                    <Input type="date" value={extracted.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Birth Place</Label>
                    <Input value={extracted.birthPlace} onChange={(e) => updateField("birthPlace", e.target.value)} placeholder="" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Gender</Label>
                    <Input value={extracted.gender} onChange={(e) => updateField("gender", e.target.value)} placeholder="Male" className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Issuance Date</Label>
                    <Input type="date" value={extracted.issuanceDate} onChange={(e) => updateField("issuanceDate", e.target.value)} className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                    <Input type="date" value={extracted.expiryDate} onChange={(e) => updateField("expiryDate", e.target.value)} className="h-9 bg-muted/30 border-accent/20 focus:border-accent" />
                  </div>
                </div>
                <Button onClick={handleConfirm} className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> CONFIRM
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
                <ScanLine className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Upload or capture any ID document</p>
                <p className="text-xs mt-1">Passport, NID, License — Powered by Google Vision OCR</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function emptyExtracted(): ExtractedData {
  return {
    title: "", firstName: "", lastName: "", country: "",
    passportNumber: "", birthDate: "", birthPlace: "",
    gender: "", issuanceDate: "", expiryDate: "",
  };
}

export default PassportScanner;
