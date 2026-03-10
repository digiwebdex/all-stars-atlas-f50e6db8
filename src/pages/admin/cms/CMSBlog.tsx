import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  PenLine, Plus, Search, Eye, Trash2, MoreHorizontal, Calendar, User,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2,
  Image, AlignLeft, AlignCenter, AlignRight, Quote, Code, Heading1,
  Heading2, Heading3, Type, Undo2, Redo2, Maximize2, Minimize2,
  ArrowLeft, Save, Clock, Globe, FileText, Tag, BarChart3, Settings2,
  Copy, ExternalLink, Pilcrow, Minus, Table, Youtube, ImagePlus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";


const statusColors: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
};
const categories = ["Destinations", "Travel Tips", "Visa Guide", "Hotels", "Medical", "News", "Guides"];
const tags = ["Bangladesh", "International", "Budget", "Luxury", "Family", "Solo", "Adventure", "Umrah", "Hajj", "Beach", "Mountain", "City"];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  img: string;
  status: string;
  readTime: string;
  views: number;
  date: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  slug: string;
  featured: boolean;
  allowComments: boolean;
}

const emptyPost: BlogPost = {
  id: "",
  title: "",
  excerpt: "",
  content: "",
  category: "Destinations",
  author: "",
  img: "",
  status: "draft",
  readTime: "5 min",
  views: 0,
  date: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  slug: "",
  featured: false,
  allowComments: true,
};

function generateDefaultContent(post: any): string {
  return `<h2>${post.title}</h2>\n<p>${post.excerpt}</p>\n<p>Written by <strong>${post.author}</strong> — ${post.readTime} read.</p>\n<h3>Introduction</h3>\n<p>This article covers everything you need to know about ${post.title.toLowerCase().replace(/^top \d+ /, '').replace(/^complete guide to /, '').replace(/^how to /, '')}. Whether you're a first-time traveller or a seasoned explorer, you'll find valuable tips and insights here.</p>\n<h3>Key Highlights</h3>\n<ul>\n<li>Comprehensive travel information and insider tips</li>\n<li>Budget-friendly options and premium experiences</li>\n<li>Practical advice for Bangladeshi travellers</li>\n<li>Updated information for 2026</li>\n</ul>\n<h3>Getting Started</h3>\n<p>Planning your trip starts with understanding what to expect. From visa requirements to the best time to visit, we've compiled everything in one place to make your journey seamless.</p>\n<blockquote>Pro Tip: Book early through Seven Trip to get the best deals and exclusive discounts on flights, hotels, and packages.</blockquote>\n<h3>Conclusion</h3>\n<p>We hope this guide helps you plan an unforgettable experience. For personalized assistance, contact our travel experts at Seven Trip — Bangladesh's #1 travel platform.</p>`;
}

function defaultPosts(): BlogPost[] {
  return [];
}

// ─── Rich Text Toolbar ───
const ToolbarButton = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) => (
  <button
    type="button"
    title={label}
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-accent transition-colors ${active ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
  >
    <Icon className="w-4 h-4" />
  </button>
);

const ToolbarSep = () => <div className="w-px h-6 bg-border mx-1" />;

// ─── Visual Editor Component ───
const VisualEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isInternalChange = useRef(false);

  // Sync external value changes (e.g., from HTML tab) into the contentEditable div
  // but skip if the change originated from typing inside the editor itself
  const lastExternalValue = useRef(value);
  if (value !== lastExternalValue.current && !isInternalChange.current) {
    lastExternalValue.current = value;
    // Schedule the DOM update after render
    setTimeout(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }, 0);
  }
  isInternalChange.current = false;

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      lastExternalValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertBlock = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) {
      isInternalChange.current = true;
      lastExternalValue.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      insertBlock(`<figure class="my-4"><img src="${url}" alt="" class="w-full rounded-lg" /><figcaption class="text-center text-sm text-gray-500 mt-2">Image caption</figcaption></figure>`);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec('createLink', url);
  };

  const insertYoutube = () => {
    const url = prompt("Enter YouTube URL:");
    if (url) {
      const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
      if (videoId) {
        insertBlock(`<div class="my-4 aspect-video"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full rounded-lg"></iframe></div>`);
      }
    }
  };

  const insertTable = () => {
    insertBlock(`<table class="w-full border-collapse my-4"><thead><tr><th class="border p-2 bg-gray-50">Header 1</th><th class="border p-2 bg-gray-50">Header 2</th><th class="border p-2 bg-gray-50">Header 3</th></tr></thead><tbody><tr><td class="border p-2">Cell 1</td><td class="border p-2">Cell 2</td><td class="border p-2">Cell 3</td></tr><tr><td class="border p-2">Cell 4</td><td class="border p-2">Cell 5</td><td class="border p-2">Cell 6</td></tr></tbody></table>`);
  };

  return (
    <div className={`border rounded-lg overflow-hidden bg-background ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Toolbar Row 1 */}
      <div className="border-b bg-muted/30 px-2 py-1.5 flex flex-wrap items-center gap-0.5">
        <ToolbarButton icon={Undo2} label="Undo" onClick={() => exec('undo')} />
        <ToolbarButton icon={Redo2} label="Redo" onClick={() => exec('redo')} />
        <ToolbarSep />
        <ToolbarButton icon={Heading1} label="Heading 1" onClick={() => exec('formatBlock', 'h1')} />
        <ToolbarButton icon={Heading2} label="Heading 2" onClick={() => exec('formatBlock', 'h2')} />
        <ToolbarButton icon={Heading3} label="Heading 3" onClick={() => exec('formatBlock', 'h3')} />
        <ToolbarButton icon={Pilcrow} label="Paragraph" onClick={() => exec('formatBlock', 'p')} />
        <ToolbarSep />
        <ToolbarButton icon={Bold} label="Bold (Ctrl+B)" onClick={() => exec('bold')} />
        <ToolbarButton icon={Italic} label="Italic (Ctrl+I)" onClick={() => exec('italic')} />
        <ToolbarButton icon={Underline} label="Underline (Ctrl+U)" onClick={() => exec('underline')} />
        <ToolbarButton icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
        <ToolbarSep />
        <ToolbarButton icon={AlignLeft} label="Align Left" onClick={() => exec('justifyLeft')} />
        <ToolbarButton icon={AlignCenter} label="Align Center" onClick={() => exec('justifyCenter')} />
        <ToolbarButton icon={AlignRight} label="Align Right" onClick={() => exec('justifyRight')} />
        <ToolbarSep />
        <ToolbarButton icon={List} label="Bullet List" onClick={() => exec('insertUnorderedList')} />
        <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={() => exec('insertOrderedList')} />
        <ToolbarButton icon={Quote} label="Blockquote" onClick={() => exec('formatBlock', 'blockquote')} />
        <ToolbarButton icon={Code} label="Code Block" onClick={() => insertBlock('<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto"><code>// Your code here</code></pre>')} />
        <ToolbarSep />
        <ToolbarButton icon={Link2} label="Insert Link" onClick={insertLink} />
        <ToolbarButton icon={Image} label="Insert Image" onClick={insertImage} />
        <ToolbarButton icon={Youtube} label="Embed YouTube" onClick={insertYoutube} />
        <ToolbarButton icon={Table} label="Insert Table" onClick={insertTable} />
        <ToolbarButton icon={Minus} label="Horizontal Rule" onClick={() => exec('insertHorizontalRule')} />
        <div className="flex-1" />
        <ToolbarButton icon={isFullscreen ? Minimize2 : Maximize2} label="Toggle Fullscreen" onClick={() => setIsFullscreen(!isFullscreen)} />
      </div>
      {/* Editor Area */}
      <div
        ref={(el) => {
          (editorRef as any).current = el;
          // Set initial content once on mount
          if (el && !el.dataset.initialized) {
            el.innerHTML = value;
            el.dataset.initialized = 'true';
          }
        }}
        contentEditable
        suppressContentEditableWarning
        className={`prose prose-sm dark:prose-invert max-w-none px-6 py-4 focus:outline-none ${isFullscreen ? 'h-[calc(100vh-52px)] overflow-y-auto' : 'min-h-[400px] max-h-[600px] overflow-y-auto'}`}
        onInput={() => {
          if (editorRef.current) {
            isInternalChange.current = true;
            lastExternalValue.current = editorRef.current.innerHTML;
            onChange(editorRef.current.innerHTML);
          }
        }}
        onPaste={() => {
          setTimeout(() => {
            if (editorRef.current) {
              isInternalChange.current = true;
              lastExternalValue.current = editorRef.current.innerHTML;
              onChange(editorRef.current.innerHTML);
            }
          }, 0);
        }}
        style={{ fontSize: '16px', lineHeight: '1.75' }}
      />
    </div>
  );
};

// ─── Word count utility ───
function getWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}
function getReadTime(words: number): string {
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min`;
}
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ═══════════ MAIN COMPONENT ═══════════
const CMSBlog = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const { data: apiPosts } = useQuery({ queryKey: ['cms', 'blog'], queryFn: () => api.get('/cms/blog'), retry: 1 });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [editorMode, setEditorMode] = useState<"list" | "edit">("list");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [filterStatus, setFilterStatus] = useState("all");
  const [autoSaveIndicator, setAutoSaveIndicator] = useState("");

  useEffect(() => {
    if (apiPosts && !initialized) {
      const raw = (apiPosts as any)?.data || (apiPosts as any)?.posts || [];
      setPosts(raw.map((p: any) => ({ ...emptyPost, ...p, id: String(p.id) })));
      setInitialized(true);
    }
  }, [apiPosts, initialized]);

  const filtered = posts.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.author?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const handleSave = async (asDraft = false) => {
    if (!editingPost) return;
    const post = { ...editingPost };
    if (asDraft) post.status = "draft";
    if (!post.title) { toast({ title: "Error", description: "Title is required", variant: "destructive" }); return; }

    post.readTime = getReadTime(getWordCount(post.content));
    if (!post.slug) post.slug = slugify(post.title);
    if (!post.seoTitle) post.seoTitle = post.title;
    if (!post.seoDescription) post.seoDescription = post.excerpt;

    try {
      if (post.id && posts.some(p => p.id === post.id)) {
        await api.put(`/cms/blog/${post.id}`, post);
        setPosts(prev => prev.map(p => p.id === post.id ? post : p));
        toast({ title: "✓ Post Saved", description: `"${post.title}" has been updated.` });
      } else {
        post.id = `post-${Date.now()}`;
        post.date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const result = await api.post('/cms/blog', post) as any;
        post.id = result?.id || post.id;
        setPosts(prev => [post, ...prev]);
        toast({ title: "✓ Post Created", description: `"${post.title}" has been created.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save post", variant: "destructive" });
    }
    setEditingPost(post);
    setAutoSaveIndicator("Saved just now");
    setTimeout(() => setAutoSaveIndicator(""), 3000);
  };

  const handleEdit = (post: any) => {
    setEditingPost({ ...emptyPost, ...post });
    setEditorMode("edit");
    setActiveTab("editor");
  };

  const handleDelete = async (post: any) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try { await api.delete(`/cms/blog/${post.id}`); } catch {}
    setPosts(prev => prev.filter(p => p.id !== post.id));
    toast({ title: "Deleted", description: `"${post.title}" has been removed.`, variant: "destructive" });
  };

  const handleDuplicate = async (post: any) => {
    const dup = { ...post, id: `post-${Date.now()}`, title: `${post.title} (Copy)`, status: "draft", views: 0, slug: `${post.slug}-copy` };
    try { const result = await api.post('/cms/blog', dup) as any; dup.id = result?.id || dup.id; } catch {}
    setPosts(prev => [dup, ...prev]);
    toast({ title: "Duplicated", description: `Copy of "${post.title}" created as draft.` });
  };

  const openNew = () => {
    setEditingPost({ ...emptyPost, id: "" });
    setEditorMode("edit");
    setActiveTab("editor");
  };

  const updateField = (field: keyof BlogPost, value: any) => {
    if (!editingPost) return;
    setEditingPost(prev => prev ? { ...prev, [field]: value } : null);
  };

  const toggleTag = (tag: string) => {
    if (!editingPost) return;
    const t = editingPost.tags || [];
    setEditingPost(prev => prev ? { ...prev, tags: t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag] } : null);
  };

  // ═══════════ EDITOR VIEW ═══════════
  if (editorMode === "edit" && editingPost) {
    const wordCount = getWordCount(editingPost.content);
    const seoTitleLen = (editingPost.seoTitle || editingPost.title).length;
    const seoDescLen = (editingPost.seoDescription || editingPost.excerpt).length;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setEditorMode("list")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> All Posts
            </Button>
            <Badge className={`${statusColors[editingPost.status]} text-[10px] font-semibold border-0`}>{editingPost.status}</Badge>
            {autoSaveIndicator && <span className="text-xs text-muted-foreground animate-in fade-in">{autoSaveIndicator}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSave(true)}>
              <FileText className="w-4 h-4 mr-1" /> Save Draft
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open('/blog', '_blank')}>
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
            <Button size="sm" onClick={() => { updateField('status', 'published'); setTimeout(() => handleSave(), 50); }}>
              <Globe className="w-4 h-4 mr-1" /> Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* Main Editor Column */}
          <div className="space-y-4">
            {/* Title */}
            <Input
              value={editingPost.title}
              onChange={e => { updateField('title', e.target.value); if (!editingPost.slug || editingPost.slug === slugify(editingPost.title.slice(0, -1))) updateField('slug', slugify(e.target.value)); }}
              placeholder="Enter post title..."
              className="text-2xl font-black border-0 shadow-none px-0 h-auto py-2 focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />
            {/* Permalink */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Permalink:</span>
              <code className="bg-muted px-2 py-0.5 rounded">seven-trip.com/blog/{editingPost.slug || 'post-url'}</code>
              <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => {
                const s = prompt("Edit slug:", editingPost.slug);
                if (s !== null) updateField('slug', slugify(s));
              }}>Edit</Button>
            </div>

            {/* Tabs: Editor / HTML / Preview */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9">
                <TabsTrigger value="editor" className="text-xs gap-1"><PenLine className="w-3.5 h-3.5" /> Visual Editor</TabsTrigger>
                <TabsTrigger value="html" className="text-xs gap-1"><Code className="w-3.5 h-3.5" /> HTML</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1"><Eye className="w-3.5 h-3.5" /> Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-3">
                <VisualEditor value={editingPost.content} onChange={(v) => updateField('content', v)} />
              </TabsContent>
              <TabsContent value="html" className="mt-3">
                <Textarea
                  value={editingPost.content}
                  onChange={e => updateField('content', e.target.value)}
                  className="font-mono text-sm min-h-[400px]"
                  placeholder="<p>Write your HTML content here...</p>"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-3">
                <Card>
                  <CardContent className="p-6 sm:p-8">
                    {editingPost.img && <img src={editingPost.img} alt="" className="w-full rounded-lg mb-6 max-h-80 object-cover" />}
                    <h1 className="text-2xl font-black mb-3">{editingPost.title || "Untitled Post"}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      {editingPost.author && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {editingPost.author}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {getReadTime(wordCount)}</span>
                      <span>{editingPost.date || "Not published yet"}</span>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: editingPost.content || '<p class="text-muted-foreground">Start writing to see preview...</p>' }} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Word Count Bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-4">
                <span>{wordCount.toLocaleString()} words</span>
                <span>{editingPost.content.length.toLocaleString()} characters</span>
                <span>~{getReadTime(wordCount)} read</span>
              </div>
              <span>Last edited: {editingPost.date || "now"}</span>
            </div>

            {/* Excerpt */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label className="font-semibold text-sm">Excerpt / Summary</Label>
                <Textarea
                  value={editingPost.excerpt}
                  onChange={e => updateField('excerpt', e.target.value)}
                  placeholder="Write a short summary that appears in blog listings and search results..."
                  rows={3}
                  className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">{(editingPost.excerpt || '').length}/300 characters recommended</p>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <Label className="font-semibold text-sm">SEO Settings</Label>
                </div>
                {/* SEO Preview */}
                <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{editingPost.seoTitle || editingPost.title || "Post Title"}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">seven-trip.com/blog/{editingPost.slug || "post-url"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{editingPost.seoDescription || editingPost.excerpt || "Post description will appear here..."}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">SEO Title</Label>
                  <Input value={editingPost.seoTitle} onChange={e => updateField('seoTitle', e.target.value)} placeholder={editingPost.title || "Custom SEO title"} className="text-sm" />
                  <p className={`text-[10px] ${seoTitleLen > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{seoTitleLen}/60 characters</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea value={editingPost.seoDescription} onChange={e => updateField('seoDescription', e.target.value)} placeholder={editingPost.excerpt || "Custom meta description"} rows={2} className="text-sm" />
                  <p className={`text-[10px] ${seoDescLen > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>{seoDescLen}/160 characters</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Focus Keywords</Label>
                  <Input value={editingPost.seoKeywords} onChange={e => updateField('seoKeywords', e.target.value)} placeholder="keyword1, keyword2, keyword3" className="text-sm" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-4">
            {/* Publish Box */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Settings2 className="w-4 h-4" /> Publish</h3>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={editingPost.status} onValueChange={v => updateField('status', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Publish Date</Label>
                  <Input type="date" value="" onChange={() => {}} className="h-9 text-sm" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Featured Post</Label>
                  <Switch checked={editingPost.featured} onCheckedChange={v => updateField('featured', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Allow Comments</Label>
                  <Switch checked={editingPost.allowComments} onCheckedChange={v => updateField('allowComments', v)} />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" onClick={() => handleSave()}>
                    <Save className="w-4 h-4 mr-1" /> {editingPost.id ? "Update" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Featured Image</h3>
                <Separator />
                {editingPost.img ? (
                  <div className="relative group">
                    <img src={editingPost.img} alt="Featured" className="w-full rounded-lg object-cover aspect-video" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => updateField('img', '')}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">No featured image set</p>
                  </div>
                )}
                <Input value={editingPost.img} onChange={e => updateField('img', e.target.value)} placeholder="Image URL..." className="text-sm h-9" />
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Tag className="w-4 h-4" /> Category & Tags</h3>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={editingPost.category} onValueChange={v => updateField('category', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <button key={t} onClick={() => toggleTag(t)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${(editingPost.tags || []).includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-primary/40'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Author */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><User className="w-4 h-4" /> Author</h3>
                <Separator />
                <Input value={editingPost.author} onChange={e => updateField('author', e.target.value)} placeholder="Author name" className="h-9 text-sm" />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  // ═══════════ LIST VIEW ═══════════
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog & Articles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {posts.length} posts • {posts.filter(p => p.status === "published").length} published • {posts.filter(p => p.status === "draft").length} drafts
          </p>
        </div>
        <Button className="font-bold" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> New Post</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", "published", "draft", "scheduled"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${filterStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-primary/40'}`}>
              {s === "all" ? `All (${posts.length})` : `${s} (${posts.filter(p => p.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No posts found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </CardContent></Card>
        ) : filtered.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow group cursor-pointer" onClick={() => handleEdit(post)}>
            <CardContent className="flex items-center gap-4 p-3 sm:p-4">
              {post.img && <img src={post.img} alt="" className="w-16 h-12 rounded-lg object-cover hidden sm:block flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{post.title}</h3>
                  {post.featured && <Badge variant="outline" className="text-[9px] h-4 border-amber-400 text-amber-600">★ Featured</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-lg">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                  {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views.toLocaleString()}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] hidden md:inline-flex">{post.category}</Badge>
              <Badge className={`${statusColors[post.status] || ''} text-[10px] font-semibold border-0`}>{post.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(post); }}><PenLine className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open("/blog", "_blank"); }}><ExternalLink className="w-4 h-4 mr-2" /> View on Site</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(post); }}><Copy className="w-4 h-4 mr-2" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(post); }}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CMSBlog;
