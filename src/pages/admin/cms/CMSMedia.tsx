import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Upload, Grid3X3, List, MoreHorizontal, Trash2, Download, Copy, Eye, Image, FileText, Film } from "lucide-react";

const mockMedia = [
  { id: 1, name: "hero-banner.jpg", type: "image", size: "2.4 MB", uploaded: "2025-03-10", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
  { id: 2, name: "coxs-bazar.jpg", type: "image", size: "1.8 MB", uploaded: "2025-03-08", url: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Cox%27s_Bazar.jpg" },
  { id: 3, name: "promo-summer.png", type: "image", size: "856 KB", uploaded: "2025-03-05", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: 4, name: "terms.pdf", type: "document", size: "340 KB", uploaded: "2025-02-28", url: "" },
  { id: 5, name: "bangkok.jpg", type: "image", size: "1.2 MB", uploaded: "2025-02-25", url: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Bangkok.jpg" },
  { id: 6, name: "promo-video.mp4", type: "video", size: "15.6 MB", uploaded: "2025-02-20", url: "" },
  { id: 7, name: "singapore.jpg", type: "image", size: "980 KB", uploaded: "2025-02-18", url: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Singapore.jpg" },
  { id: 8, name: "maldives.jpg", type: "image", size: "1.5 MB", uploaded: "2025-02-15", url: "https://tbbd-flight.s3.ap-southeast-1.amazonaws.com/promotion/Maafushi.jpg" },
];

const typeIcons: Record<string, typeof Image> = {
  image: Image,
  document: FileText,
  video: Film,
};

const CMSMedia = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = mockMedia.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <Button><Upload className="w-4 h-4 mr-1.5" /> Upload Files</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search media..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Drag & drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Support: JPG, PNG, GIF, PDF, MP4 • Max 25MB</p>
      </div>

      {/* Grid View */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((media) => {
            const Icon = typeIcons[media.type] || FileText;
            return (
              <Card key={media.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-muted">
                  {media.type === "image" && media.url ? (
                    <img src={media.url} alt={media.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate">{media.name}</p>
                  <p className="text-[10px] text-muted-foreground">{media.size}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((media) => {
                const Icon = typeIcons[media.type] || FileText;
                return (
                  <div key={media.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {media.type === "image" && media.url ? (
                        <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{media.name}</p>
                      <p className="text-xs text-muted-foreground">{media.size} • {media.uploaded}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="w-4 h-4 mr-2" /> Copy URL</DropdownMenuItem>
                        <DropdownMenuItem><Download className="w-4 h-4 mr-2" /> Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CMSMedia;
