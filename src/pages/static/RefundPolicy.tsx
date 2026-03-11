import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, any> = { CreditCard, Clock, CheckCircle2, AlertCircle };

const RefundPolicy = () => {
  const { data: content, isLoading } = useCmsPageContent("/refund-policy");

  const hero = content?.hero || { title: "Refund Policy", subtitle: "Last updated: February 25, 2026" };
  const notice = content?.refundNotice || "";
  const policies = content?.refundPolicies || [];
  const timeline = content?.refundTimeline || [];

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
        <div className="container mx-auto px-4 relative text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">{hero.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">{hero.subtitle}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {notice && (
            <Card className="mb-8 border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 p-5">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{notice}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-8 mb-12">
            {policies.map((p, i) => (
              <div key={i}>
                <h2 className="text-lg font-bold mb-3">{p.title}</h2>
                <ul className="space-y-2">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {timeline.length > 0 && (
            <>
              <h2 className="text-lg font-bold mb-4">Refund Timeline</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {timeline.map((t, i) => {
                  const Icon = iconMap[t.icon] || Clock;
                  return (
                    <Card key={i}>
                      <CardContent className="flex items-start gap-3 p-5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{t.label}</h4>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default RefundPolicy;
