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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Upload, BookOpen, FileText } from "lucide-react";

type Resource = {
  id: number;
  title: string;
  subjectName: string | null;
  topicName: string | null;
  description: string | null;
  fileName: string | null;
  fileType: string | null;
  tags: string | null;
  fileSize: number | null;
  createdAt: string;
};

const emptyForm = {
  title: "", subjectName: "", topicName: "", description: "", tags: "",
};

export default function AdminResources() {
  const { token } = useAuth() as any;
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

  useEffect(() => { fetchResources(); }, []);

  async function fetchResources() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/resources/list`, {
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

  async function createResource() {
    if (!form.title) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);
      const res = await fetch(`${apiBase}/admin/resources/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      toast({ title: "Resource uploaded!" });
      setShowCreate(false);
      setForm({ ...emptyForm });
      setFile(null);
      fetchResources();
    } catch {
      toast({ title: "Failed to upload resource", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteResource(id: number) {
    try {
      await fetch(`${apiBase}/admin/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted" });
      setDeleteId(null);
      fetchResources();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground mt-1">Upload and manage study materials for students</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Upload Resource
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div><p className="text-2xl font-bold">{resources.length}</p><p className="text-sm text-muted-foreground">Total Resources</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-500" />
              <div><p className="text-2xl font-bold">{resources.filter(r => r.fileType === "pdf").length}</p><p className="text-sm text-muted-foreground">PDFs</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div><p className="text-2xl font-bold">{resources.filter(r => r.fileType !== "pdf").length}</p><p className="text-sm text-muted-foreground">Docs & Text</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Resources</CardTitle>
            <CardDescription>Manage uploaded study materials</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3" />
                <p>No resources yet. Upload your first resource!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[160px] truncate">{r.title}</TableCell>
                      <TableCell>{r.subjectName || "—"}</TableCell>
                      <TableCell>{r.topicName || "—"}</TableCell>
                      <TableCell>
                        {r.fileName ? (
                          <span className="flex items-center gap-1 text-sm">
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{r.fileName}</span>
                            {r.fileType && <Badge variant="outline" className="text-xs ml-1">.{r.fileType.toUpperCase()}</Badge>}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatSize(r.fileSize)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.tags || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(r.id)}
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
            <DialogTitle>Upload Resource</DialogTitle>
            <DialogDescription>Add a new study material for students</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input placeholder="e.g. Percentage Formula Notes"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input placeholder="e.g. Quantitative Aptitude"
                  value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Topic</Label>
                <Input placeholder="e.g. Percentage"
                  value={form.topicName} onChange={e => setForm(f => ({ ...f, topicName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input placeholder="Brief description..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="e.g. formulas, notes, shortcuts"
                value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Upload File (PDF / DOCX / TXT)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file" accept=".pdf,.docx,.txt,.doc"
                  id="res-file" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="res-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT supported</p>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createResource} disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource?</DialogTitle>
            <DialogDescription>This will permanently delete the resource and its file.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteResource(deleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
