import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, PenLine, MoreHorizontal, Trash2, Star, Building2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const destinations = [
  { id: 1, name: "Cox's Bazar", country: "Bangladesh", hotels: 97, type: "domestic", featured: true, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg" },
  { id: 2, name: "Bangkok", country: "Thailand", hotels: 4351, type: "international", featured: true, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg" },
  { id: 3, name: "Sylhet", country: "Bangladesh", hotels: 44, type: "domestic", featured: true, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/AzOSQlJV2UD8QhKVOKLteYWlrI9brl.png" },
  { id: 4, name: "Singapore", country: "Singapore", hotels: 813, type: "international", featured: true, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg" },
  { id: 5, name: "Kuala Lumpur", country: "Malaysia", hotels: 2464, type: "international", featured: false, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Kuala_Lumpur.jpg" },
  { id: 6, name: "Maldives", country: "Maldives", hotels: 36, type: "international", featured: true, img: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg" },
];

const CMSDestinations = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Destinations</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage popular destinations shown on the homepage</p>
      </div>
      <Button className="font-bold"><Plus className="w-4 h-4 mr-1" /> Add Destination</Button>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {destinations.map(d => (
        <Card key={d.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
          <div className="relative h-36">
            <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">{d.name}</h3>
                <p className="text-white/60 text-[11px]">{d.country}</p>
              </div>
              <Badge className={d.type === "domestic" ? "bg-accent/80 text-accent-foreground text-[10px]" : "bg-primary/80 text-primary-foreground text-[10px]"}>
                {d.type}
              </Badge>
            </div>
          </div>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {d.hotels.toLocaleString()} hotels</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Featured: <Switch checked={d.featured} className="scale-75" /></span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><PenLine className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default CMSDestinations;
