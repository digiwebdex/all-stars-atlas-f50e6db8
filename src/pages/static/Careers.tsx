import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Heart, Rocket, ArrowRight, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = { Heart, Rocket, Users, Briefcase, MapPin };

const Careers = () => {
  const { toast } = useToast();
  const { data: content, isLoading } = useCmsPageContent("/careers");

  const hero = content?.hero || { title: "Join Our Team", subtitle: "Help us revolutionize travel in Bangladesh." };
  const perks = content?.perks || [];
  const positions = content?.positions || [];
  const careersEmail = content?.careersEmail || "careers@seven-trip.com";

  const handleApply = (title: string) => {
    window.location.href = `mailto:${encodeURIComponent(careersEmail)}?subject=Application for ${encodeURIComponent(title)}&body=Hi, I would like to apply for the ${encodeURIComponent(title)} position. Please find my CV attached.`;
    toast({ title: "Opening email client", description: `Applying for ${title}` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-10 w-48 mx-auto mb-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">{hero.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          {perks.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Why Seven Trip?</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {perks.map(p => {
                  const Icon = iconMap[p.icon] || Heart;
                  return (
                    <Card key={p.title}>
                      <CardContent className="p-5 text-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold mb-1">{p.title}</h3>
                        <p className="text-sm text-muted-foreground">{p.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {positions.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
              <div className="space-y-4">
                {positions.map(pos => (
                  <Card key={pos.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{pos.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">{pos.dept}</Badge>
                          <Badge variant="outline" className="text-xs"><MapPin className="w-3 h-3 mr-1" />{pos.location}</Badge>
                          <Badge variant="outline" className="text-xs">{pos.type}</Badge>
                        </div>
                      </div>
                      <Button className="font-bold shrink-0" onClick={() => handleApply(pos.title)}>
                        Apply <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Don't see a role that fits? Send your CV to</p>
            <a href={`mailto:${careersEmail}`} className="text-primary font-bold text-lg hover:underline">{careersEmail}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
