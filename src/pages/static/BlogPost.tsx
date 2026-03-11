import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter } from "lucide-react";
import { useCmsPageContent } from "@/hooks/useCmsContent";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

const BlogPost = () => {
  const { toast } = useToast();
  const { slug } = useParams();
  const { data: content, isLoading } = useCmsPageContent(`/blog/${slug}`);

  const post = content?.blogPost;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title || 'Blog Post',
        text: post?.excerpt || 'Check out this blog post!',
        url: window.location.href,
      }).then(() => {
        toast({
          title: "Shared!",
          description: "Thanks for sharing this article.",
        })
      })
        .catch((error) => console.log('Error sharing', error));
    } else {
      toast({
        title: "Sharing failed",
        description: "Web Share API is not supported in your browser.",
      })
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-16">
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
      <div className="min-h-screen bg-muted/30 pt-36 lg:pt-48 pb-16">
        <div className="container mx-auto px-4 max-w-3xl text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border pt-36 lg:pt-48 pb-16">
        <div className="container mx-auto px-4">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Link>
          </Button>
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-3xl space-y-6 py-12">
        <img src={post.image} alt={post.title} className="w-full rounded-xl shadow-md" />
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">{post.title}</h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(post.date)}</span>
          <Separator orientation="vertical" className="h-4" />
          <User className="w-4 h-4" />
          <span>{post.author}</span>
        </div>
        <div className="flex items-center space-x-2">
          {post.tags?.map((tag: string) => <Badge key={tag}>{tag}</Badge>)}
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3 prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          <div className="hidden md:block">
            <h3 className="text-lg font-semibold mb-4">Share this article</h3>
            <Button variant="outline" className="w-full mb-2" onClick={handleShare}><Share2 className="w-4 h-4 mr-2" /> Share</Button>
            <Button variant="secondary" className="w-full mb-2"><Facebook className="w-4 h-4 mr-2" /> Share on Facebook</Button>
            <Button variant="secondary" className="w-full mb-2"><Twitter className="w-4 h-4 mr-2" /> Share on Twitter</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
