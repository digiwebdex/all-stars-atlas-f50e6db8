import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Headphones, Globe, ArrowRight, Facebook, Instagram, Linkedin } from "lucide-react";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { useSubmitContact } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = { MapPin, Phone, Mail, Clock };

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const submitContact = useSubmitContact();
  const { data: content, isLoading } = useCmsPageContent("/contact");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    try {
      await submitContact.mutateAsync({ name, email, phone, subject, message } as any);
      toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
      setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to send message. Please try again.", variant: "destructive" });
    }
  };

  const hero = content?.hero || { title: "Contact Us", subtitle: "We're here to help with your travel needs 24/7" };
  const contactInfo = content?.contactInfo || [];
  const formTitle = content?.formTitle || "Send us a Message";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-10 w-48 mx-auto mb-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
        <div className="container mx-auto px-4 relative text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">{hero.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {contactInfo.map((c, i) => {
                const Icon = iconMap[c.icon] || MapPin;
                return (
                  <Card key={i}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold mb-1">{c.title}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{c.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-6">{formTitle}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Full Name *</Label>
                        <Input placeholder="Your name" className="h-11" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="you@example.com" className="h-11" value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input type="tel" placeholder="+880 1XXX-XXXXXX" className="h-11" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Subject</Label>
                        <Input placeholder="How can we help?" className="h-11" value={subject} onChange={e => setSubject(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Message *</Label>
                      <Textarea placeholder="Tell us more about your inquiry..." rows={5} value={message} onChange={e => setMessage(e.target.value)} />
                    </div>
                    <Button type="submit" className="h-11 font-bold shadow-lg shadow-primary/20" disabled={submitContact.isPending}>
                      <Send className="w-4 h-4 mr-1.5" /> {submitContact.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
