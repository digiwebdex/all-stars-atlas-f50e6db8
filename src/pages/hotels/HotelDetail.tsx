import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Heart, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useHotelDetails } from "@/hooks/useApiData";
import { useAuth } from "@/hooks/useAuth";
import AuthGateModal from "@/components/AuthGateModal";
import DataLoader from "@/components/DataLoader";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { data, isLoading, error, refetch } = useHotelDetails(id);
  const { toast } = useToast();
  
  const hotel = (data as any)?.hotel || {};
  const rooms = hotel?.rooms || [];
  const images = hotel.images || [];
  const cheapestRoom = rooms.reduce((min: any, r: any) => (!min || r.price < min.price) ? r : min, null);

  const handleBookRoom = (room: any) => {
    setSelectedRoom(room);
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    submitBooking(room);
  };

  const submitBooking = async (room: any) => {
    setBookingLoading(true);
    try {
      const result: any = await api.post('/hotels/book', {
        hotelId: id,
        hotelName: hotel.name,
        location: hotel.location,
        roomType: room.name || room.type || 'Standard',
        checkIn: new URLSearchParams(window.location.search).get('checkIn') || '',
        checkOut: new URLSearchParams(window.location.search).get('checkOut') || '',
        guests: 2,
        price: room.price,
        taxes: Math.round(room.price * 0.15),
        total: Math.round(room.price * 1.15),
      });
      navigate("/booking/confirmation", {
        state: {
          booking: {
            type: "Hotel",
            bookingRef: result.bookingRef || result.id,
            route: `${hotel.name} — ${hotel.location}`,
            baseFare: room.price,
            taxes: Math.round(room.price * 0.15),
            total: Math.round(room.price * 1.15),
            paymentMethod: "Pending",
            passenger: result.guestName || "Guest",
            pnr: result.pnr || (result.bookingRef || '').substring(0, 6).toUpperCase(),
          },
        },
      });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err?.message || "Could not complete booking. Please try again.", variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48">
      <DataLoader isLoading={isLoading} error={error} skeleton="detail" retry={refetch}>
        {/* Image Gallery */}
        {images.length > 0 && (
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
        )}

        <div className="container mx-auto px-4 pb-10">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                {hotel.stars > 0 && (
                  <div className="flex gap-0.5 mb-1">{Array.from({ length: hotel.stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
                )}
                <h1 className="text-2xl sm:text-3xl font-black mb-1">{hotel.name}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-4 h-4" /> {hotel.location}</p>
                {hotel.rating && (
                  <div className="flex items-center gap-3 mt-3">
                    <span className="bg-primary text-primary-foreground text-sm font-bold px-2.5 py-1 rounded-lg">{hotel.rating}</span>
                    <span className="text-sm"><strong>Excellent</strong> · {hotel.reviews} reviews</span>
                  </div>
                )}
              </div>

              {hotel.description && <p className="text-sm text-muted-foreground leading-relaxed">{hotel.description}</p>}

              {hotel.amenities?.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-3">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {hotel.amenities.map((a: string) => (
                      <div key={a} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success" /> {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rooms.length > 0 && (
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
                              <Button size="sm" className="font-bold" onClick={() => handleBookRoom(room)}>
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {hotel.policies?.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold mb-3">Hotel Policies</h2>
                  <ul className="space-y-2">
                    {hotel.policies.map((p: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {cheapestRoom && (
              <div>
                <Card className="sticky top-28">
                  <CardContent className="p-5 space-y-4">
                    <div className="text-center">
                      {cheapestRoom.originalPrice && <p className="text-xs text-muted-foreground line-through">৳{cheapestRoom.originalPrice.toLocaleString()}</p>}
                      <p className="text-3xl font-black text-primary">৳{cheapestRoom.price?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per night · includes taxes</p>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      {hotel.rating && <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold">{hotel.rating}/5 ({hotel.reviews} reviews)</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Rooms from</span><span className="font-bold">৳{cheapestRoom.price?.toLocaleString()}</span></div>
                    </div>
                    <Button className="w-full h-11 font-bold shadow-lg shadow-primary/20" onClick={() => handleBookRoom(cheapestRoom)}>
                      Reserve Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">Free cancellation available on select rooms</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DataLoader>

      <AuthGateModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={() => {
          setAuthOpen(false);
          if (selectedRoom) submitBooking(selectedRoom);
        }}
        title="Sign in to book your hotel"
        description="Create an account or sign in to complete your reservation."
      />
    </div>
  );
};

export default HotelDetail;
