import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, User, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: content, isLoading } = useCmsPageContent("/blog");

  const hero = content?.hero || { title: "Travel Blog", subtitle: "Tips, guides, and inspiration for your next adventure" };
  const posts = content?.blogPosts || [];
  const categories = content?.blogCategories || ["All", "Destinations", "Travel Tips", "Visa Guide", "Hotels", "Medical"];

  const filtered = posts.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory !== "All" && p.category !== activeCategory) return false;
    return true;
  });

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
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">{hero.subtitle}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-10 h-11" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/40"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 && activeCategory === "All" && !search && (
            <Link to={`/blog/${slugify(filtered[0].title)}`}>
              <Card className="mb-8 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-2">
                  <div className="aspect-[16/10] md:aspect-auto">
                    <img src={filtered[0].img} alt={filtered[0].title} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-6 sm:p-8 flex flex-col justify-center">
                    <Badge className="w-fit mb-3 text-xs">{filtered[0].category}</Badge>
                    <h2 className="text-xl sm:text-2xl font-black mb-3 leading-tight">{filtered[0].title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{filtered[0].excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {filtered[0].author}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].readTime}</span>
                      <span>{filtered[0].date}</span>
                    </div>
                    <Button className="w-fit font-bold">
                      Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </Link>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No articles found matching your search.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(activeCategory === "All" && !search ? filtered.slice(1) : filtered).map(post => (
                <Link key={post.id} to={`/blog/${slugify(post.title)}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all group h-full">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <CardContent className="p-5">
                      <Badge variant="secondary" className="text-[10px] mb-2">{post.category}</Badge>
                      <h3 className="font-bold text-sm mb-2 leading-snug line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blog;
