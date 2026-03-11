import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

const Terms = () => {
  const { data: content, isLoading } = useCmsPageContent("/terms");

  const hero = content?.hero || { title: "Terms & Conditions", subtitle: "Last updated: February 25, 2026" };
  const sections = content?.sections?.filter(s => s.visible).sort((a, b) => a.order - b.order) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-3" />
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
          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.id}>
                <h2 className="text-lg font-bold mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
