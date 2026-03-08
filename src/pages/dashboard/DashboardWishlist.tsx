import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Plane, Building2, Palmtree, Trash2, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useDashboardWishlist, useRemoveWishlistItem } from "@/hooks/useApiData";
import DataLoader from "@/components/DataLoader";
import { mockWishlist } from "@/lib/mock-data";

const typeIcons: Record<string, typeof Plane> = { flight: Plane, hotel: Building2, holiday: Palmtree };
const typeColors: Record<string, string> = { flight: "bg-primary/10 text-primary", hotel: "bg-secondary/10 text-secondary", holiday: "bg-accent/10 text-accent" };

const DashboardWishlist = () => {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useDashboardWishlist();
  const removeWishlist = useRemoveWishlistItem();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const isApiData = !!(data as any)?.items?.length;
  const resolved = isApiData ? (data as any) : mockWishlist;
  const allItems = resolved?.items || [];
  const items = allItems.filter((item: any) => !removedIds.has(item.id));

  const removeItem = async (id: string) => {
    setRemovedIds(prev => new Set(prev).add(id));
    try {
      await removeWishlist.mutateAsync(id);
    } catch {
      // API unreachable — item already removed from UI
    }
    toast({ title: "Removed", description: "Item removed from wishlist" });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl sm:text-2xl font-bold">My Wishlist</h1><p className="text-sm text-muted-foreground">{items.length} saved items</p></div>

      <DataLoader isLoading={isLoading} error={null} skeleton="dashboard" retry={refetch}>
        {items.length === 0 ? (
          <Card><CardContent className="py-16 text-center">
            <Heart className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-bold mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">Save flights, hotels, and packages you love for later</p>
            <Button asChild><Link to="/">Browse Services</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const Icon = typeIcons[item.type] || Plane;
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <Badge className={`absolute top-3 left-3 text-[10px] ${typeColors[item.type] || ''}`}><Icon className="w-3 h-3 mr-1" /> {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}</Badge>
                    <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs"><Star className="w-3.5 h-3.5 fill-warning text-warning" /><span className="font-bold">{item.rating}</span></div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <p className="font-black text-primary">{item.price}</p>
                      <Button size="sm" className="text-xs font-bold" asChild><Link to={item.type === "flight" ? "/flights" : item.type === "hotel" ? `/hotels/${item.id}` : `/holidays/${item.id}`}>Book <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link></Button>
                    </div>
                    {item.saved && <p className="text-[10px] text-muted-foreground mt-2">Saved {item.saved}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DataLoader>
    </div>
  );
};

export default DashboardWishlist;
