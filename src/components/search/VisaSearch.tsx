import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Globe, MapPin, Users } from "lucide-react";

const VisaSearch = () => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Applying From</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Bangladesh" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travelling To</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Select country" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Visa Type</Label>
          <Input placeholder="Tourist" className="h-12 bg-background" />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travellers</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input type="number" defaultValue={1} min={1} className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-2">
          <Button size="lg" className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VisaSearch;
