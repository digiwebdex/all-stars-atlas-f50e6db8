import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, User, Calendar, Share2, Facebook, Twitter, Linkedin, Copy, ArrowRight, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { data: content, isLoading } = useCmsPageContent("/blog");

  const allPosts = content?.blogPosts || [];

  const post = allPosts.find((p: any) => slugify(p.title) === slug);
  const relatedPosts = allPosts
    .filter((p: any) => p.id !== post?.id && p.category === post?.category)
    .slice(0, 3);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast({ title: "Link Copied!", description: "Article link copied to clipboard." });
    } else {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 pt-24 lg:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-muted/30 pt-24 lg:pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog</Link></Button>
        </div>
      </div>
    );
  }

  const articleContent = (post as any).content || `
    <p>${post.excerpt}</p>
    <h2>Introduction</h2>
    <p>${post.title} is a comprehensive guide that covers everything you need to know. Whether you're a first-time visitor or a seasoned traveller, this article will help you make the most of your experience.</p>
    <h2>Key Highlights</h2>
    <ul>
      <li>Essential tips and recommendations from local experts</li>
      <li>Budget-friendly options for every type of traveller</li>
      <li>Must-see attractions and hidden gems</li>
      <li>Practical information including visa requirements and best time to visit</li>
    </ul>
    <h2>Planning Your Trip</h2>
    <p>Planning ahead is crucial for getting the best deals and ensuring a smooth journey. We recommend booking flights at least 3-4 weeks in advance and comparing prices across multiple dates for the best fares.</p>
    <blockquote>"The world is a book and those who do not travel read only one page." — Saint Augustine</blockquote>
    <h2>Final Thoughts</h2>
    <p>We hope this guide helps you plan an unforgettable trip. For personalized assistance with your travel plans, don't hesitate to contact our 24/7 support team or explore our curated packages.</p>
  `;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      {post.img && (
        <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img src={post.img} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="container mx-auto max-w-3xl">
              <Badge className="mb-3">{post.category}</Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">{post.title}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-3xl py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{post.title}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readTime}</span>
          {post.views > 0 && <span>{post.views.toLocaleString()} views</span>}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div
              className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: articleContent }}
            />
          </CardContent>
        </Card>

        {/* Share */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-semibold flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share:</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShare("facebook")}><Facebook className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShare("twitter")}><Twitter className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShare("linkedin")}><Linkedin className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => handleShare("copy")}><Copy className="w-4 h-4" /></Button>
        </div>

        <Separator className="mb-8" />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-5">Related Articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedPosts.map((rp: any) => (
                <Link key={rp.id} to={`/blog/${slugify(rp.title)}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all group h-full">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={rp.img} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-[10px] mb-2">{rp.category}</Badge>
                      <h3 className="font-bold text-sm leading-snug line-clamp-2">{rp.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">{rp.readTime} • {rp.author}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="text-center mt-10">
          <Button variant="outline" asChild>
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to All Articles</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
