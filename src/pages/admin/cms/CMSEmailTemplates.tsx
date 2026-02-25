import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Eye, PenLine, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const templates = [
  { id: 1, name: "Booking Confirmation", subject: "Your TravelHub Booking is Confirmed! ✈️", trigger: "On booking confirmed", active: true, lastEdited: "Feb 20, 2026" },
  { id: 2, name: "Payment Receipt", subject: "Payment Received — TravelHub", trigger: "On payment approved", active: true, lastEdited: "Feb 18, 2026" },
  { id: 3, name: "Booking Cancelled", subject: "Booking Cancellation Notice", trigger: "On booking cancelled", active: true, lastEdited: "Feb 15, 2026" },
  { id: 4, name: "Refund Processed", subject: "Your Refund Has Been Processed", trigger: "On refund completed", active: true, lastEdited: "Feb 12, 2026" },
  { id: 5, name: "Visa Status Update", subject: "Visa Application Update", trigger: "On visa status change", active: true, lastEdited: "Feb 10, 2026" },
  { id: 6, name: "Welcome Email", subject: "Welcome to TravelHub! 🌍", trigger: "On user registration", active: true, lastEdited: "Feb 8, 2026" },
  { id: 7, name: "Password Reset", subject: "Reset Your Password — TravelHub", trigger: "On password reset request", active: true, lastEdited: "Feb 5, 2026" },
  { id: 8, name: "Promotional Offer", subject: "Exclusive Deal Just for You!", trigger: "Manual / Scheduled", active: false, lastEdited: "Feb 1, 2026" },
];

const CMSEmailTemplates = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage transactional and notification email templates</p>
      </div>
      <Button className="font-bold"><Plus className="w-4 h-4 mr-1" /> New Template</Button>
    </div>

    <div className="space-y-3">
      {templates.map(t => (
        <Card key={t.id} className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{t.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Trigger: {t.trigger} · Edited {t.lastEdited}</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={t.active} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                  <DropdownMenuItem><PenLine className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default CMSEmailTemplates;
