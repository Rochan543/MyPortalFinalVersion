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
import { Search, FileText, Download, Eye, Archive, Filter, Calendar, Loader2 } from "lucide-react";

type Paper = {
  id: number;
  examName: string | null;
  examYear: number | null;
  shiftName: string | null;
  subjectName: string | null;
  title: string;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  filePath: string | null;
  createdAt: string;
};

export default function PreviousPapers() {
  const { token } = useAuth() as any;
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [viewing, setViewing] = useState<Paper | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // const apiBase = (import.meta.env.BASE_URL || "").replace(/\/$/, "") + "/api";
  const apiBase = import.meta.env.VITE_API_URL + "/api";

  useEffect(() => { fetchPapers(); }, []);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  async function fetchPapers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterExam && filterExam !== "all") params.set("examName", filterExam);
      if (filterYear && filterYear !== "all") params.set("year", filterYear);
      const res = await fetch(`${apiBase}/previous-papers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPapers(await res.json());
    } catch {
      toast({ title: "Failed to load papers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function closeDialog() {
    setViewing(null);
    setPdfLoading(false);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPdfBlobUrl(null);
  }

  async function openViewer(paper: Paper) {
    setViewing(paper);
    setPdfBlobUrl(null);

    // if (paper.fileType === "pdf") {
    //   // Fetch PDF blob with auth header, then create a blob:// URL for the iframe
    //   setPdfLoading(true);
    //   try {
    //     const res = await fetch(`${apiBase}/previous-papers/${paper.id}/file`, {
    //       headers: { Authorization: `Bearer ${token}` },
    //     });
    //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
    //     const blob = await res.blob();
    //     if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    //     const url = URL.createObjectURL(blob);
    //     blobUrlRef.current = url;
    //     setPdfBlobUrl(url);
    //   } catch {
    //     toast({ title: "Could not load PDF", description: "Try downloading instead.", variant: "destructive" });
    //   } finally {
    //     setPdfLoading(false);
    //   }
    // }
    if (paper.fileType === "pdf") {
  setPdfLoading(true);

  try {
    setPdfBlobUrl(paper.filePath || null);
  } catch {
    toast({
      title: "Could not load PDF",
      description: "Try downloading instead.",
      variant: "destructive",
    });
  } finally {
    setPdfLoading(false);
  }
}
  }

  // function downloadPaper(paper: Paper) {
  //   fetch(`${apiBase}/previous-papers/${paper.id}/file?download=1`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //     .then(r => {
  //       if (!r.ok) throw new Error();
  //       return r.blob();
  //     })
  //     .then(blob => {
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = paper.fileName || "paper";
  //       document.body.appendChild(a);
  //       a.click();
  //       document.body.removeChild(a);
  //       URL.revokeObjectURL(url);
  //     })
  //     .catch(() => toast({ title: "Download failed", variant: "destructive" }));
  // }

  function downloadPaper(paper: Paper) {
  if (!paper.filePath) return;

  window.open(paper.filePath, "_blank");
}

  const examNames = [...new Set(papers.map(p => p.examName).filter(Boolean))] as string[];
  const years = [...new Set(papers.map(p => p.examYear).filter(Boolean))].sort((a, b) => b! - a!) as number[];

  const filtered = papers.filter(p => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.examName || "").toLowerCase().includes(search.toLowerCase());
    const matchExam = filterExam === "all" || p.examName === filterExam;
    const matchYear = filterYear === "all" || String(p.examYear) === filterYear;
    return matchSearch && matchExam && matchYear;
  });

  // Group by exam name
  const grouped: Record<string, Paper[]> = {};
  for (const p of filtered) {
    const key = p.examName || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  const examColors: Record<string, string> = {
    "SSC": "bg-blue-100 text-blue-800 border-blue-200",
    "BANKING": "bg-green-100 text-green-800 border-green-200",
    "IBPS": "bg-green-100 text-green-800 border-green-200",
    "SBI": "bg-green-100 text-green-800 border-green-200",
    "RRB": "bg-orange-100 text-orange-800 border-orange-200",
    "UPSC": "bg-purple-100 text-purple-800 border-purple-200",
  };

  const getExamColor = (exam: string | null) => {
    const key = Object.keys(examColors).find(k => (exam || "").toUpperCase().includes(k));
    return key ? examColors[key] : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Previous Year Papers</h1>
          <p className="text-muted-foreground mt-1">Access and download previous year question papers for all exams</p>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search papers..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchPapers()}
            />
          </div>
          <Select value={filterExam} onValueChange={setFilterExam}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {examNames.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={fetchPapers} variant="secondary">Search</Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">No papers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([examName, examPapers]) => (
              <div key={examName}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-sm px-3 py-1 border ${getExamColor(examName)}`}>{examName}</Badge>
                  <span className="text-sm text-muted-foreground">{examPapers.length} paper{examPapers.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {examPapers.map(paper => (
                    <Card key={paper.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold leading-tight">{paper.title}</h3>
                          {paper.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{paper.description}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {paper.examYear && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {paper.examYear}
                            </span>
                          )}
                          {paper.shiftName && (
                            <Badge variant="outline" className="text-xs">{paper.shiftName}</Badge>
                          )}
                          {paper.subjectName && (
                            <Badge variant="secondary" className="text-xs">{paper.subjectName}</Badge>
                          )}
                          {paper.fileType && (
                            <Badge variant="outline" className="text-xs">.{paper.fileType.toUpperCase()}</Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {paper.filePath && (
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openViewer(paper)}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                            </Button>
                          )}
                          {paper.filePath && (
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadPaper(paper)}>
                              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewing} onOpenChange={closeDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewing?.title}
              {viewing?.examYear && (
                <Badge variant="secondary" className="ml-1">{viewing.examYear}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            {pdfLoading ? (
              <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading PDF…</p>
              </div>
            ) : viewing?.fileType === "pdf" && pdfBlobUrl ? (
              /* blob:// URL carries the file data — no auth header needed in iframe */
              // <iframe
              //   src={pdfBlobUrl}
              //   className="w-full h-[70vh] border rounded bg-muted"
              //   title={viewing?.title || "PDF Viewer"}
              // />

              <iframe
              src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfBlobUrl)}`}
              className="w-full h-[70vh] border rounded bg-muted"
              title={viewing?.title || "PDF Viewer"}
            />
            ) : viewing?.fileType === "pdf" && !pdfBlobUrl ? (
              <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p>PDF preview could not be loaded.</p>
                {viewing && (
                  <Button variant="outline" onClick={() => downloadPaper(viewing)}>
                    <Download className="mr-2 h-4 w-4" /> Download instead
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p>This file type ({viewing?.fileType?.toUpperCase()}) can only be downloaded.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {viewing && viewing.filePath && (
              <Button onClick={() => downloadPaper(viewing)}>
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
