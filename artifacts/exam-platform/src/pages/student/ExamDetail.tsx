import React from "react";
import { Link, useParams, useLocation } from "wouter";
import { useGetExam, useStartAttempt, getGetExamQueryKey } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, FileText, AlertTriangle, ArrowLeft, PlayCircle } from "lucide-react";

export function ExamDetail() {
  const { examId } = useParams();
  const id = parseInt(examId || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: exam, isLoading, error } = useGetExam(id, {
    query: {
      enabled: !!id,
      queryKey: getGetExamQueryKey(id),
    }
  });

  const startMutation = useStartAttempt();

  const handleStart = () => {
    if (!exam) return;
    startMutation.mutate(
      { data: { examId: exam.id } },
      {
        onSuccess: (data) => {
          setLocation(`/exam/${data.id}/take`);
        },
        onError: (err) => {
          toast({
            title: "Could not start exam",
            description: err.message || "An error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StudentLayout>
    );
  }

  if (error || !exam) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Exam not found</h2>
          <Button variant="link" asChild className="mt-4">
            <Link href="/exams">Back to Exams</Link>
          </Button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link href="/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Link>
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge>{exam.examType}</Badge>
                {exam.negativeMarks > 0 && (
                  <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                    Negative Marking: -{exam.negativeMarks}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
              <p className="text-lg text-muted-foreground mt-2">{exam.description}</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{exam.duration}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{exam.questionCount || 0}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{exam.totalMarks}</div>
              <div className="text-sm text-muted-foreground">Total Marks</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Sections</CardTitle>
            <CardDescription>This exam contains the following sections.</CardDescription>
          </CardHeader>
          <CardContent>
            {exam.sections && exam.sections.length > 0 ? (
              <div className="space-y-4">
                {exam.sections.map((section, index) => (
                  <div key={section.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{section.sectionName}</div>
                      <div className="text-sm flex gap-4 text-muted-foreground">
                        <span>{section.questionCount || 0} Questions</span>
                        <span>{section.sectionDuration > 0 ? `${section.sectionDuration} Mins` : 'Overall Time'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground italic text-sm">No sections defined for this exam.</div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 flex flex-col items-start gap-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-1 text-foreground">Instructions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure you have a stable internet connection.</li>
                <li>Do not refresh the page or close the browser during the exam.</li>
                <li>The exam will auto-submit when the timer reaches zero.</li>
              </ul>
            </div>
            <Button size="lg" className="w-full sm:w-auto" onClick={handleStart} disabled={startMutation.isPending}>
              <PlayCircle className="mr-2 h-5 w-5" />
              {startMutation.isPending ? "Starting..." : "Start Exam"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </StudentLayout>
  );
}
