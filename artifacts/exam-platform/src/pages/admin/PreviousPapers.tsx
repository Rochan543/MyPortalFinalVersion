import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Upload, Archive, FileText, Calendar } from "lucide-react";

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
  fileSize: number | null;
  createdAt: string;
};

const emptyForm = {
  title: "", examName: "", examYear: "", shiftName: "", subjectName: "", description: "",
};

const EXAM_TYPES = ["SSC CGL", "SSC CHSL", "SSC MTS", "SBI PO", "SBI Clerk", "IBPS PO", "IBPS Clerk", "RRB NTPC", "RRB Group D", "UPSC CSE", "Other"];

export default function AdminPreviousPapers() {
  const { token } = useAuth() as any;
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

  useEffect(() => { fetchPapers(); }, []);

  async function fetchPapers() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/previous-papers/list`, {
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

  async function createPaper() {
    if (!form.title) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);
      const res = await fetch(`${apiBase}/admin/previous-papers/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      toast({ title: "Paper uploaded!" });
      setShowCreate(false);
      setForm({ ...emptyForm });
      setFile(null);
      fetchPapers();
    } catch {
      toast({ title: "Failed to upload paper", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePaper(id: number) {
    try {
      await fetch(`${apiBase}/admin/previous-papers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted" });
      setDeleteId(null);
      fetchPapers();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const years = [...new Set(papers.map(p => p.examYear).filter(Boolean))].sort((a, b) => b! - a!);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Previous Year Papers</h1>
            <p className="text-muted-foreground mt-1">Upload and manage previous year question papers</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Upload Paper
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Archive className="h-8 w-8 text-primary" />
              <div><p className="text-2xl font-bold">{papers.length}</p><p className="text-sm text-muted-foreground">Total Papers</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div><p className="text-2xl font-bold">{years.length}</p><p className="text-sm text-muted-foreground">Years Covered</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{[...new Set(papers.map(p => p.examName).filter(Boolean))].length}</p>
                <p className="text-sm text-muted-foreground">Exam Types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Papers</CardTitle>
            <CardDescription>Manage uploaded previous year papers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : papers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-3" />
                <p>No papers yet. Upload your first paper!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {papers.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[160px] truncate">{p.title}</TableCell>
                      <TableCell>{p.examName || "—"}</TableCell>
                      <TableCell>{p.examYear || "—"}</TableCell>
                      <TableCell>{p.shiftName || "—"}</TableCell>
                      <TableCell>
                        {p.fileName ? (
                          <span className="flex items-center gap-1 text-sm">
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{p.fileName}</span>
                            {p.fileType && <Badge variant="outline" className="text-xs">.{p.fileType.toUpperCase()}</Badge>}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatSize(p.fileSize)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Previous Year Paper</DialogTitle>
            <DialogDescription>Add a previous year question paper for students</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Paper Title *</Label>
              <Input placeholder="e.g. SSC CGL 2024 Shift 2 - Full Paper"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Exam Name</Label>
                <Select value={form.examName} onValueChange={v => setForm(f => ({ ...f, examName: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" placeholder="e.g. 2024" min="2000" max="2030"
                  value={form.examYear} onChange={e => setForm(f => ({ ...f, examYear: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Shift</Label>
                <Select value={form.shiftName} onValueChange={v => setForm(f => ({ ...f, shiftName: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shift 1">Shift 1</SelectItem>
                    <SelectItem value="Shift 2">Shift 2</SelectItem>
                    <SelectItem value="Shift 3">Shift 3</SelectItem>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Full Day">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject (optional)</Label>
                <Input placeholder="e.g. Reasoning"
                  value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input placeholder="Brief description..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Upload File (PDF / DOCX / TXT)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file" accept=".pdf,.docx,.txt"
                  id="paper-file" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="paper-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT supported (max 100MB)</p>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createPaper} disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Paper"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Paper?</DialogTitle>
            <DialogDescription>This will permanently delete the paper and its file.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deletePaper(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
