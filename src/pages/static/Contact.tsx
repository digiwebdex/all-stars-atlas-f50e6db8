import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const contactInfo = [
  { icon: MapPin, title: "Office Address", text: "123 Travel Street, Motijheel C/A\nDhaka 1000, Bangladesh" },
  { icon: Phone, title: "Phone", text: "+880 1234-567890\n+880 9876-543210" },
  { icon: Mail, title: "Email", text: "support@travelhub.com.bd\nbooking@travelhub.com.bd" },
  { icon: Clock, title: "Working Hours", text: "Sunday - Thursday: 9AM - 8PM\nFriday - Saturday: 10AM - 6PM" },
];

const Contact = () => (
  <div className="min-h-screen bg-muted/30">
    <section className="relative bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] pt-24 lg:pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-4 relative text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Contact Us</h1>
        <p className="text-white/60 text-sm sm:text-base max-w-lg mx-auto">We're here to help with your travel needs 24/7</p>
      </div>
    </section>

    <section className="py-10 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((c, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">{c.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{c.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-bold mb-6">Send us a Message</h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input placeholder="Your name" className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" placeholder="you@example.com" className="h-11" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input type="tel" placeholder="+880 1XXX-XXXXXX" className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Subject</Label>
                      <Input placeholder="How can we help?" className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <Textarea placeholder="Tell us more about your inquiry..." rows={5} />
                  </div>
                  <Button className="h-11 font-bold shadow-lg shadow-primary/20">
                    <Send className="w-4 h-4 mr-1.5" /> Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default Contact;
