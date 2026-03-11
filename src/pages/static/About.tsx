import { Building2, Users, Globe, Award, Target, Heart, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = { Target, Heart, Globe, Award, Shield, Zap, Users, Building2 };

const About = () => {
  const { data: content, isLoading } = useCmsPageContent("/about");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-48 mx-auto" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-16 space-y-4">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-24 max-w-3xl mx-auto" />
        </div>
      </div>
    );
  }

  const hero = content?.hero || { title: "About Seven Trip", subtitle: "Bangladesh's most trusted travel platform since 2018" };
  const storyText = content?.storyText || "";
  const values = content?.values || [];
  const stats = content?.stats || [];
  const team = content?.team || [];

  return (
    <div className="min-h-screen bg-muted/30">
      <section className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
        <div className="container mx-auto px-4 relative text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">{hero.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          {storyText && (
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed">{storyText}</p>
            </div>
          )}

          {values.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
              {values.map((v, i) => {
                const Icon = iconMap[v.icon] || Target;
                return (
                  <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-sm mb-2">{v.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {stats.length > 0 && (
            <div className="bg-gradient-to-br from-[hsl(217,91%,50%)] to-[hsl(224,70%,28%)] rounded-2xl p-8 sm:p-12 mb-16">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-black text-white">{s.value}</div>
                    <div className="text-xs text-white/60 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {team.length > 0 && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Our Leadership</h2>
                <p className="text-sm text-muted-foreground">The people behind Seven Trip</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
                {team.map((t, i) => (
                  <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold text-lg">
                        {t.avatar}
                      </div>
                      <h4 className="font-bold text-sm">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default About;
