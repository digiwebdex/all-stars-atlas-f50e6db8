import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { UserPlus, Edit2, Trash2, User, FileText } from "lucide-react";
import { useState } from "react";

const mockTravellers = [
  { id: 1, name: "Rafiq Ahmed", type: "Adult", gender: "Male", passport: "AB1234567", nationality: "Bangladeshi", dob: "1990-05-15", email: "rafiq@example.com", phone: "+880171XXXXXXX" },
  { id: 2, name: "Fatema Khatun", type: "Adult", gender: "Female", passport: "CD7654321", nationality: "Bangladeshi", dob: "1992-08-20", email: "fatema@example.com", phone: "+880181XXXXXXX" },
  { id: 3, name: "Kamal Jr.", type: "Child", gender: "Male", passport: "EF1122334", nationality: "Bangladeshi", dob: "2015-03-10", email: "", phone: "" },
];

const DashboardTravellers = () => {
  const [travellers] = useState(mockTravellers);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Travellers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your frequent traveller profiles for faster booking</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-1.5" /> Add Traveller
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Traveller</DialogTitle>
              <DialogDescription>Fill in the traveller details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input placeholder="First name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Passport Number</Label>
                  <Input placeholder="AB1234567" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nationality</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bd">Bangladeshi</SelectItem>
                      <SelectItem value="in">Indian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="+880 1XXX-XXXXXX" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1">Save Traveller</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Traveller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {travellers.map((t) => (
          <Card key={t.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.nationality}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span>{t.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DOB</span>
                  <span>{t.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passport</span>
                  <span className="font-mono text-xs">{t.passport}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardTravellers;
