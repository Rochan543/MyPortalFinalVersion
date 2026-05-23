import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetExam, 
  useGetQuestions,
  useCreateQuestion,
  useDeleteQuestion,
  getGetQuestionsQueryKey,
  getGetExamQueryKey,
  CreateQuestionRequestQuestionType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash, FileQuestion } from "lucide-react";

export function AdminExamQuestions() {
  const { examId } = useParams();
  const id = parseInt(examId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exam, isLoading: examLoading } = useGetExam(id, { query: { enabled: !!id, queryKey: getGetExamQueryKey(id) } });
  const { data: qData, isLoading: questionsLoading } = useGetQuestions({ examId: id, limit: 100 }, { query: { enabled: !!id, queryKey: getGetQuestionsQueryKey({ examId: id, limit: 100 }) } });

  const createMutation = useCreateQuestion();
  const deleteMutation = useDeleteQuestion();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newQ, setNewQ] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
    marks: 1,
    negativeMarks: 0.25,
    subjectId: "",
    topicId: "",
    difficulty: "EASY",
    year: new Date().getFullYear(),
    questionType: "MCQ" as CreateQuestionRequestQuestionType
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      // { data: { ...newQ, examId: id } },
{
  data: {
    ...(newQ as any),

    examId: id,

    subjectId: newQ.subjectId
      ? parseInt(newQ.subjectId)
      : undefined,

    topicId: newQ.topicId
      ? parseInt(newQ.topicId)
      : undefined,
  } as any,
},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetQuestionsQueryKey({ examId: id, limit: 100 }) });
          setIsCreateOpen(false);
          toast({ title: "Question added" });
          // Reset form but keep some defaults
          setNewQ({
            ...newQ,
            questionText: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            explanation: "",
            correctAnswer: "A",
          });
        },
        onError: (err) => {
          toast({ title: "Failed to add question", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (qId: number) => {
    if (confirm("Delete this question?")) {
      deleteMutation.mutate(
        { questionId: qId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetQuestionsQueryKey({ examId: id, limit: 100 }) });
            toast({ title: "Question deleted" });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/admin/exams"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams</Link>
          </Button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
              <p className="text-muted-foreground">{exam?.title}</p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Question</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea required rows={3} value={newQ.questionText} onChange={e => setNewQ({...newQ, questionText: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Option A</Label>
                        <Input required value={newQ.optionA} onChange={e => setNewQ({...newQ, optionA: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Option B</Label>
                        <Input required value={newQ.optionB} onChange={e => setNewQ({...newQ, optionB: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Option C</Label>
                        <Input required value={newQ.optionC} onChange={e => setNewQ({...newQ, optionC: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Option D</Label>
                        <Input required value={newQ.optionD} onChange={e => setNewQ({...newQ, optionD: e.target.value})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Correct Answer</Label>
                        <Select value={newQ.correctAnswer} onValueChange={v => setNewQ({...newQ, correctAnswer: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select value={newQ.questionType} onValueChange={(v: any) => setNewQ({...newQ, questionType: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MCQ">MCQ</SelectItem>
                            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                            <SelectItem value="NUMERICAL">Numerical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">

  {/* Subject */}
  <div className="space-y-2">
    <Label>Subject</Label>

    <Select
      value={newQ.subjectId}
      onValueChange={(v) =>
        setNewQ({
          ...newQ,
          subjectId: v,
        })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Subject" />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="1">
          Quantitative Aptitude
        </SelectItem>

        <SelectItem value="2">
          Reasoning
        </SelectItem>

        <SelectItem value="3">
          English
        </SelectItem>

        <SelectItem value="4">
          General Awareness
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* Topic */}
  <div className="space-y-2">
    <Label>Topic</Label>

    <Select
      value={newQ.topicId}
      onValueChange={(v) =>
        setNewQ({
          ...newQ,
          topicId: v,
        })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Topic" />
      </SelectTrigger>

      <SelectContent>

        <SelectItem value="1">
          Percentage
        </SelectItem>

        <SelectItem value="2">
          Profit & Loss
        </SelectItem>

        <SelectItem value="3">
          Coding Decoding
        </SelectItem>

        <SelectItem value="4">
          Blood Relations
        </SelectItem>

      </SelectContent>
    </Select>
  </div>

  {/* Difficulty */}
  <div className="space-y-2">
    <Label>Difficulty</Label>

    <Select
      value={newQ.difficulty}
      onValueChange={(v) =>
        setNewQ({
          ...newQ,
          difficulty: v,
        })
      }
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="EASY">
          Easy
        </SelectItem>

        <SelectItem value="MEDIUM">
          Medium
        </SelectItem>

        <SelectItem value="HARD">
          Hard
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Marks</Label>
                        <Input type="number" min={1} required value={newQ.marks} onChange={e => setNewQ({...newQ, marks: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Negative Marks</Label>
                        <Input type="number" step="0.01" min={0} required value={newQ.negativeMarks} onChange={e => setNewQ({...newQ, negativeMarks: Number(e.target.value)})} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Explanation (Optional)</Label>
                      <Textarea rows={2} value={newQ.explanation} onChange={e => setNewQ({...newQ, explanation: e.target.value})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>Add Question</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4">
          {questionsLoading ? (
            <div className="p-8 text-center border rounded-lg bg-card">Loading questions...</div>
          ) : !qData?.questions?.length ? (
            <div className="p-12 text-center border rounded-lg bg-card flex flex-col items-center justify-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground">No questions added yet.</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>Add your first question</Button>
            </div>
          ) : (
            qData.questions.map((q, idx) => (
              <Card key={q.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-base font-medium">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {q.questionText}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(q.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm mt-2">
                    <div className={`p-2 border rounded ${q.correctAnswer === 'A' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>A. {q.optionA}</div>
                    <div className={`p-2 border rounded ${q.correctAnswer === 'B' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>B. {q.optionB}</div>
                    <div className={`p-2 border rounded ${q.correctAnswer === 'C' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>C. {q.optionC}</div>
                    <div className={`p-2 border rounded ${q.correctAnswer === 'D' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>D. {q.optionD}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
