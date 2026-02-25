import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Palmtree, CalendarDays, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useState } from "react";

const HolidaySearch = () => {
  const [travelDate, setTravelDate] = useState<Date>();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Destination</Label>
          <div className="relative">
            <Palmtree className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Where do you want to go?" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travel Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start font-normal bg-background">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                {travelDate ? format(travelDate, "dd MMM, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={travelDate} onSelect={setTravelDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Travellers</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input type="number" defaultValue={2} min={1} className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-3">
          <Button size="lg" className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
            <Search className="w-4 h-4 mr-2" />
            Search Packages
          </Button>
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground mr-1">Popular:</span>
        {["Cox's Bazar", "Maldives", "Thailand", "Malaysia", "Turkey", "Dubai"].map((dest) => (
          <button
            key={dest}
            className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {dest}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HolidaySearch;
