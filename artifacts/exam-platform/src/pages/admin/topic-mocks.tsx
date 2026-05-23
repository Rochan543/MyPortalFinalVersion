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
import {
  Plus, Trash2, Edit, Upload, Eye, EyeOff, FileText, Clock, BookOpen, Layers,
} from "lucide-react";

type TopicMock = {
  id: number;
  title: string;
  subjectName: string | null;
  topicName: string | null;
  duration: number;
  totalMarks: number;
  negativeMarks: number;
  isPublished: boolean;
  questionCount: number;
  createdAt: string;
};

const defaultForm = {
  title: "",
  subjectName: "",
  topicName: "",
  duration: "15",
  negativeMarks: "0.25",
  examType: "TOPIC_MOCK",
};

export default function AdminTopicMocksPage() {
  const { token } = useAuth() as any;
  const { toast } = useToast();

  const [mocks, setMocks] = useState<TopicMock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [file, setFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";
  const apiBase = import.meta.env.VITE_API_URL + "/api";

  useEffect(() => { fetchMocks(); }, []);

  async function fetchMocks() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/topic-mocks/admin/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMocks(data);
    } catch {
      toast({ title: "Failed to load topic mocks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function createMock() {
    if (!form.title || !form.subjectName || !form.topicName) {
      toast({ title: "Title, Subject and Topic are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("file", file);

      const res = await fetch(`${apiBase}/topic-mocks/admin/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({ title: "Topic mock created!", description: `${data.questionsInserted || 0} questions extracted` });
      setShowCreateDialog(false);
      setForm({ ...defaultForm });
      setFile(null);
      fetchMocks();
    } catch {
      toast({ title: "Failed to create topic mock", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadQuestions(mockId: number) {
    if (!uploadFile) { toast({ title: "Please select a file", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch(`${apiBase}/topic-mocks/admin/${mockId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({ title: "Questions uploaded!", description: `${data.questionsInserted} questions added` });
      setShowUploadDialog(null);
      setUploadFile(null);
      fetchMocks();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(mock: TopicMock) {
    try {
      const res = await fetch(`${apiBase}/topic-mocks/admin/${mock.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publish: !mock.isPublished }),
      });
      if (!res.ok) throw new Error();
      toast({ title: mock.isPublished ? "Unpublished" : "Published!" });
      fetchMocks();
    } catch {
      toast({ title: "Failed to update publish status", variant: "destructive" });
    }
  }

  async function deleteMock(id: number) {
    try {
      await fetch(`${apiBase}/topic-mocks/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Deleted successfully" });
      setDeleteConfirm(null);
      fetchMocks();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const subjects = [...new Set(mocks.map(m => m.subjectName).filter(Boolean))];
  const published = mocks.filter(m => m.isPublished).length;
  const draft = mocks.filter(m => !m.isPublished).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Topic Mock Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage topic-wise mock tests</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Topic Mock
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div><p className="text-2xl font-bold">{mocks.length}</p><p className="text-sm text-muted-foreground">Total Mocks</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-500" />
              <div><p className="text-2xl font-bold">{published}</p><p className="text-sm text-muted-foreground">Published</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <EyeOff className="h-8 w-8 text-orange-400" />
              <div><p className="text-2xl font-bold">{draft}</p><p className="text-sm text-muted-foreground">Drafts</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Layers className="h-8 w-8 text-blue-500" />
              <div><p className="text-2xl font-bold">{subjects.length}</p><p className="text-sm text-muted-foreground">Subjects</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Topic Mocks</CardTitle>
            <CardDescription>Manage your topic-wise mock tests below</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : mocks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3" />
                <p>No topic mocks yet. Create your first one!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mocks.map(mock => (
                    <TableRow key={mock.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{mock.title}</TableCell>
                      <TableCell>{mock.subjectName || "—"}</TableCell>
                      <TableCell>{mock.topicName || "—"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" /> {mock.duration}m
                        </span>
                      </TableCell>
                      <TableCell>{mock.questionCount}</TableCell>
                      <TableCell>
                        <Badge variant={mock.isPublished ? "default" : "secondary"}>
                          {mock.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm" variant="ghost"
                            title={mock.isPublished ? "Unpublish" : "Publish"}
                            onClick={() => togglePublish(mock)}
                          >
                            {mock.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            title="Upload more questions"
                            onClick={() => setShowUploadDialog(mock.id)}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            title="Manage Questions"
                            onClick={() => window.location.href = `/admin/exams/${mock.id}/questions`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => setDeleteConfirm(mock.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Topic Mock</DialogTitle>
            <DialogDescription>Fill in the details and optionally upload a question file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Mock Title *</Label>
              <Input placeholder="e.g. Blood Relation Practice Set 1"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Input placeholder="e.g. Reasoning"
                  value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Topic *</Label>
                <Input placeholder="e.g. Blood Relations"
                  value={form.topicName} onChange={e => setForm(f => ({ ...f, topicName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Duration (minutes)</Label>
                <Input type="number" min="1" max="180"
                  value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Negative Marks</Label>
                <Input type="number" min="0" step="0.25"
                  value={form.negativeMarks} onChange={e => setForm(f => ({ ...f, negativeMarks: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Exam Type</Label>
              <Select value={form.examType} onValueChange={v => setForm(f => ({ ...f, examType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOPIC_MOCK">Topic Mock</SelectItem>
                  <SelectItem value="SSC">SSC</SelectItem>
                  <SelectItem value="RRB">RRB</SelectItem>
                  <SelectItem value="BANKING">Banking</SelectItem>
                  <SelectItem value="UPSC">UPSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Upload Questions (TXT / DOCX / PDF)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".txt,.docx,.pdf"
                  id="mock-file"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="mock-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">TXT, DOCX, PDF supported</p>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createMock} disabled={submitting}>
              {submitting ? "Creating..." : "Create Mock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload More Questions Dialog */}
      <Dialog open={showUploadDialog !== null} onOpenChange={() => setShowUploadDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Questions</DialogTitle>
            <DialogDescription>Add more questions to this topic mock from a file</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".txt,.docx,.pdf"
                id="upload-file"
                className="hidden"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="upload-file" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploadFile ? uploadFile.name : "Click to select file"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">TXT, DOCX, PDF</p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(null)}>Cancel</Button>
            <Button onClick={() => showUploadDialog && uploadQuestions(showUploadDialog)} disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Questions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic Mock?</DialogTitle>
            <DialogDescription>
              This will permanently delete the topic mock and all its questions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMock(deleteConfirm)}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
