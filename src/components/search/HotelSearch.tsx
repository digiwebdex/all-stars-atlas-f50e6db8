import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Building2, CalendarDays, Users, Search } from "lucide-react";

const HotelSearch = () => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Destination / Hotel Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Where are you going?" className="pl-10 h-12 bg-background" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Check-in</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start font-normal bg-background">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                {checkIn ? format(checkIn, "dd MMM") : "Select"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Check-out</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start font-normal bg-background">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                {checkOut ? format(checkOut, "dd MMM") : "Select"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rooms & Guests</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start font-normal bg-background">
                <Users className="w-4 h-4 mr-2 text-primary" />
                {rooms} Room, {guests} Guest
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                {[
                  { label: "Rooms", value: rooms, set: setRooms, min: 1 },
                  { label: "Guests", value: guests, set: setGuests, min: 1 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => item.set(Math.max(item.min, item.value - 1))}>-</Button>
                      <span className="w-6 text-center text-sm">{item.value}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => item.set(item.value + 1)}>+</Button>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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

export default HotelSearch;
