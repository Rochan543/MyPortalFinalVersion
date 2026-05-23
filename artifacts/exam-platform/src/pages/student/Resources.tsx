import { useState, useEffect, useRef } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, FileText, Download, Eye, BookOpen, Filter, X, Loader2 } from "lucide-react";

type Resource = {
  id: number;
  title: string;
  subjectName: string | null;
  topicName: string | null;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  filePath: string | null;
  tags: string | null;
  createdAt: string;
};

export default function Resources() {
  const { token } = useAuth() as any;
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [viewContent, setViewContent] = useState<{ type: string; content: string } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  // blob URL for PDF — avoids needing to send auth headers in iframe
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // const apiBase = (import.meta.env.BASE_URL || "").replace(/\/$/, "") + "/api";
  const apiBase = import.meta.env.VITE_API_URL + "/api";

  useEffect(() => { fetchResources(); }, []);

  // Revoke blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  async function fetchResources() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterSubject && filterSubject !== "all") params.set("subject", filterSubject);
      const res = await fetch(`${apiBase}/resources?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setResources(await res.json());
    } catch {
      toast({ title: "Failed to load resources", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function closeDialog() {
    setViewing(null);
    setViewContent(null);
    setViewLoading(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPdfBlobUrl(null);
  }

  async function viewResource(resource: Resource) {
    setViewing(resource);
    setViewContent(null);
    setPdfBlobUrl(null);

    if (resource.fileType === "pdf") {
      // Fetch PDF with auth token and create a blob URL for the iframe
      setViewLoading(true);
      try {
        const res = await fetch(`${apiBase}/resources/${resource.id}/file`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        // Revoke any previous blob URL
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setPdfBlobUrl(url);
      } catch (err) {
        toast({ title: "Could not load PDF", description: "Please try downloading instead.", variant: "destructive" });
      } finally {
        setViewLoading(false);
      }
    } else if (resource.fileType === "txt" || resource.fileType === "docx") {
      setViewLoading(true);
      try {
        const res = await fetch(`${apiBase}/resources/${resource.id}/content`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        setViewContent(await res.json());
      } catch {
        toast({ title: "Could not load file content", variant: "destructive" });
      } finally {
        setViewLoading(false);
      }
    }
  }

  function downloadResource(resource: Resource) {
    setViewLoading(true);
    fetch(`${apiBase}/resources/${resource.id}/file?download=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = resource.fileName || "resource";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => toast({ title: "Download failed", variant: "destructive" }))
      .finally(() => setViewLoading(false));
  }

  const subjects = [...new Set(resources.map(r => r.subjectName).filter(Boolean))] as string[];
  const filtered = resources.filter(r => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.subjectName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.topicName || "").toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === "all" || r.subjectName === filterSubject;
    return matchSearch && matchSubject;
  });

  const fileIcon = (type: string | null) => {
    if (type === "pdf") return "📄";
    if (type === "docx" || type === "doc") return "📝";
    if (type === "txt") return "📃";
    return "📁";
  };

  const fileColor = (type: string | null) => {
    if (type === "pdf") return "text-red-600 border-red-200 bg-red-50";
    if (type === "docx" || type === "doc") return "text-blue-600 border-blue-200 bg-blue-50";
    return "text-green-600 border-green-200 bg-green-50";
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Resources</h1>
          <p className="text-muted-foreground mt-1">Browse and download notes, formula sheets, and study materials</p>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchResources()}
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={fetchResources} variant="secondary">Search</Button>
          {(search || filterSubject !== "all") && (
            <Button variant="ghost" onClick={() => { setSearch(""); setFilterSubject("all"); setTimeout(fetchResources, 0); }}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">No resources found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(resource => (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{fileIcon(resource.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold leading-tight line-clamp-2">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {resource.subjectName && (
                      <Badge variant="secondary" className="text-xs">{resource.subjectName}</Badge>
                    )}
                    {resource.topicName && (
                      <Badge variant="outline" className="text-xs">{resource.topicName}</Badge>
                    )}
                    {resource.fileType && (
                      <Badge className={`text-xs border ${fileColor(resource.fileType)}`}>
                        .{resource.fileType.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {resource.tags && (
                    <p className="text-xs text-muted-foreground">
                      {resource.tags.split(",").map(t => t.trim()).map(t => `#${t}`).join(" ")}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    {resource.filePath && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => viewResource(resource)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                      </Button>
                    )}
                    {resource.filePath && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadResource(resource)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Resource Dialog */}
      <Dialog open={!!viewing} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewing?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            {viewLoading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading file…</p>
              </div>
            ) : viewing?.fileType === "pdf" && pdfBlobUrl ? (
              /* PDF: use authenticated blob URL — no auth header needed in iframe */
              <iframe
                src={pdfBlobUrl}
                className="w-full h-[60vh] border rounded bg-muted"
                title={viewing?.title || "PDF Viewer"}
              />
            ) : viewing?.fileType === "pdf" && !pdfBlobUrl ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p>Could not load PDF preview.</p>
                <Button variant="outline" onClick={() => viewing && downloadResource(viewing)}>
                  <Download className="mr-2 h-4 w-4" /> Download instead
                </Button>
              </div>
            ) : viewContent?.type === "html" ? (
              <div
                className="prose max-w-none overflow-y-auto h-[60vh] p-4 border rounded bg-background"
                dangerouslySetInnerHTML={{ __html: viewContent.content }}
              />
            ) : viewContent?.type === "text" ? (
              <pre className="whitespace-pre-wrap break-words overflow-y-auto h-[60vh] p-4 border rounded bg-muted text-sm font-mono">
                {viewContent.content}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p>No preview available.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {viewing?.filePath && (
              <Button onClick={() => viewing && downloadResource(viewing)} disabled={viewLoading}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            )}
            <Button variant="outline" onClick={closeDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
