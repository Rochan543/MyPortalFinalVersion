import React, { useState } from "react";
import { Link } from "wouter";
import { 
  useGetExams, 
  useCreateExam, 
  useDeleteExam, 
  usePublishExam,
  getGetExamsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Plus, Trash, Edit, CheckCircle, ListTodo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminExams() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetExams({ 
    search: search || undefined, 
    page,
    limit: 10
  });

  const createMutation = useCreateExam();
  const deleteMutation = useDeleteExam();
  const publishMutation = usePublishExam();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newExam, setNewExam] = useState({
  title: "",
  description: "",
  examType: "SSC",
  duration: 60,
  totalMarks: 100,
  negativeMarks: 0.25,

  isTopicMock: false,
  subjectName: "",
  topicName: "",
});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { data: newExam },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey() });
          setIsCreateOpen(false);
          toast({ title: "Exam created successfully" });
          setNewExam({
                    title: "",
                    description: "",
                    examType: "SSC",
                    duration: 60,
                    totalMarks: 100,
                    negativeMarks: 0.25,
                    isTopicMock: false,
                    subjectName: "",
                    topicName: "",
                  });
        },
        onError: (err) => {
          toast({ title: "Failed to create exam", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      deleteMutation.mutate(
        { examId: id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey() });
            toast({ title: "Exam deleted" });
          }
        }
      );
    }
  };

  const handlePublish = (id: number) => {
    publishMutation.mutate(
      { examId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExamsQueryKey() });
          toast({ title: "Exam published" });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Manage Exams</h2>
          
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Exam</DialogTitle>
                  <DialogDescription>Define the basic parameters of the exam. You can add questions later.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Exam Title</Label>
                      <Input id="title" required value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Exam Type</Label>
                      <Select value={newExam.examType} onValueChange={v => setNewExam({...newExam, examType: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SSC">SSC</SelectItem>
                          <SelectItem value="RRB">RRB</SelectItem>
                          <SelectItem value="BANKING">Banking</SelectItem>
                          <SelectItem value="UPSC">UPSC</SelectItem>
                          <SelectItem value="DEFENCE">Defence</SelectItem>
                          <SelectItem value="STATE">State</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (mins)</Label>
                        <Input id="duration" type="number" required min={1} value={newExam.duration} onChange={e => setNewExam({...newExam, duration: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marks">Total Marks</Label>
                        <Input id="marks" type="number" required min={1} value={newExam.totalMarks} onChange={e => setNewExam({...newExam, totalMarks: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negative">Negative Marking</Label>
                      <Input id="negative" type="number" step="0.01" min={0} value={newExam.negativeMarks} onChange={e => setNewExam({...newExam, negativeMarks: Number(e.target.value)})} />
                    </div>
                        <div className="space-y-2">

                                    <Label>
                                      Exam Category
                                    </Label>

                                    <Select
                                      value={String(newExam.isTopicMock)}
                                      onValueChange={(value) =>
                                        setNewExam({
                                          ...newExam,
                                          isTopicMock:
                                            value === "true",
                                        })
                                      }
                                    >

                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>

                                      <SelectContent>
                                        <SelectItem value="false">
                                          Normal Exam
                                        </SelectItem>

                                        <SelectItem value="true">
                                          Topic Mock Test
                                        </SelectItem>
                                      </SelectContent>

                                    </Select>

                                  </div>

                              {newExam.isTopicMock && (
                                <>

                                  <div className="space-y-2">

                                    <Label>
                                      Subject Name
                                    </Label>

                                    <Input
                                      value={newExam.subjectName}
                                      onChange={(e) =>
                                        setNewExam({
                                          ...newExam,
                                          subjectName:
                                            e.target.value,
                                        })
                                      }
                                    />

                                  </div>

                                  <div className="space-y-2">

                                    <Label>
                                      Topic Name
                                    </Label>

                                    <Input
                                      value={newExam.topicName}
                                      onChange={(e) =>
                                        setNewExam({
                                          ...newExam,
                                          topicName:
                                            e.target.value,
                                        })
                                      }
                                    />

                                      </div>

  </>
)}
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description</Label>
                      <Textarea id="desc" rows={3} value={newExam.description} onChange={e => setNewExam({...newExam, description: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Exam"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : !data?.exams?.length ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No exams found</TableCell></TableRow>
                ) : (
                  data.exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell><Badge variant="outline">{exam.examType}</Badge></TableCell>
                      <TableCell>{exam.questionCount || 0}</TableCell>
                      <TableCell>{exam.duration}m</TableCell>
                      <TableCell>
                        {exam.isPublished ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/exams/${exam.id}/questions`}>
                                <ListTodo className="mr-2 h-4 w-4" /> Manage Questions
                              </Link>
                            </DropdownMenuItem>
                            {!exam.isPublished && (
                              <DropdownMenuItem onClick={() => handlePublish(exam.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Publish Exam
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(exam.id)}>
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
