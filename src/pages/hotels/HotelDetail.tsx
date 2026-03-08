import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Wifi, Waves, Car, UtensilsCrossed, Heart, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useHotelDetails } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";

const fallbackHotel = {
  name: "Sea Pearl Beach Resort & Spa", location: "Cox's Bazar, Bangladesh", stars: 5,
  rating: 4.8, reviews: 431, description: "Experience luxury on the world's longest natural sea beach. Sea Pearl Beach Resort & Spa offers world-class amenities, stunning ocean views, and impeccable service.",
  images: [
    "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/agoda-2564409-60592569-839740.jpg",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80",
  ],
  amenities: ["Free WiFi", "Swimming Pool", "Restaurant", "Free Parking", "Spa & Wellness", "Gym", "Room Service", "Airport Shuttle"],
  policies: ["Check-in: 2:00 PM", "Check-out: 12:00 PM", "Free cancellation before 48 hours", "Children under 5 stay free"],
  rooms: [
    { name: "Deluxe Ocean View", size: "35 sqm", beds: "1 King Bed", price: 8500, originalPrice: 11000, perks: ["Ocean View", "Balcony", "Breakfast"] },
    { name: "Premium Suite", size: "55 sqm", beds: "1 King Bed + Sofa", price: 14000, originalPrice: 18000, perks: ["Ocean View", "Living Area", "Breakfast", "Lounge Access"] },
    { name: "Standard Room", size: "28 sqm", beds: "2 Single Beds", price: 5500, originalPrice: 7000, perks: ["Garden View", "Breakfast"] },
  ],
};

const HotelDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useHotelDetails(id);
  
  const apiHotel = (data as any)?.hotel;
  const hotel = apiHotel || fallbackHotel;
  const rooms = apiHotel?.rooms || fallbackHotel.rooms;
  const images = hotel.images || fallbackHotel.images;
  const cheapestRoom = rooms.reduce((min: any, r: any) => (!min || r.price < min.price) ? r : min, null);

  return (
    <div className="min-h-screen bg-muted/30 pt-20 lg:pt-28">
      <DataLoader isLoading={isLoading} error={error && !apiHotel ? error : null} skeleton="detail" retry={refetch}>
        {/* Image Gallery */}
        <div className="container mx-auto px-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden max-h-[400px]">
            <div className="md:col-span-2 md:row-span-2">
              <img src={images[0]} alt={hotel.name} className="w-full h-full object-cover" />
            </div>
            {images.slice(1, 3).map((img: string, i: number) => (
              <div key={i}><img src={img} alt="" className="w-full h-48 md:h-full object-cover" loading="lazy" /></div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-10">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex gap-0.5 mb-1">{Array.from({ length: hotel.stars || 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
                <h1 className="text-2xl sm:text-3xl font-black mb-1">{hotel.name}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {hotel.location}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-1 rounded-lg">{hotel.rating}</span>
                  <span className="text-sm"><strong>Excellent</strong> · {hotel.reviews} reviews</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{hotel.description}</p>

              <div>
                <h2 className="text-lg font-bold mb-3">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(hotel.amenities || []).map((a: string) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" /> {a}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold mb-3">Available Rooms</h2>
                <div className="space-y-3">
                  {rooms.map((room: any, i: number) => (
                    <Card key={i} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold">{room.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{room.size} · {room.beds}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(room.perks || []).map((p: string) => <Badge key={p} variant="outline" className="text-[10px] font-medium">{p}</Badge>)}
                            </div>
                          </div>
                          <div className="text-right">
                            {room.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{room.originalPrice.toLocaleString()}</p>}
                            <p className="text-xl font-black text-primary">৳{room.price.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground mb-2">per night</p>
                            <Button size="sm" className="font-bold" asChild>
                              <Link to={`/booking/confirmation`} state={{ booking: { type: "hotel", hotelName: hotel.name, roomType: room.name, amount: room.price } }}>
                                Book Now
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {(hotel.policies || fallbackHotel.policies).length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-3">Hotel Policies</h2>
                  <ul className="space-y-2">
                    {(hotel.policies || fallbackHotel.policies).map((p: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-28">
                <CardContent className="p-5 space-y-4">
                  <div className="text-center">
                    {cheapestRoom?.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{cheapestRoom.originalPrice.toLocaleString()}</p>}
                    <p className="text-3xl font-black text-primary">৳{cheapestRoom?.price?.toLocaleString() || "8,500"}</p>
                    <p className="text-xs text-muted-foreground">per night · includes taxes</p>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold">{hotel.rating}/5 ({hotel.reviews} reviews)</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Rooms from</span><span className="font-bold">৳{cheapestRoom?.price?.toLocaleString()}</span></div>
                  </div>
                  <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" asChild>
                    <Link to="/booking/confirmation" state={{ booking: { type: "hotel", hotelName: hotel.name, amount: cheapestRoom?.price } }}>
                      Reserve Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">Free cancellation available on select rooms</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DataLoader>
    </div>
  );
};

export default HotelDetail;
