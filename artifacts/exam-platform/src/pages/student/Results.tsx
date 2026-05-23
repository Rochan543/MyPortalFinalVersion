import React from "react";
import { useParams, Link } from "wouter";
import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MinusCircle, ArrowLeft } from "lucide-react";

export function Results() {
  const { attemptId } = useParams();
  const id = parseInt(attemptId || "0");
  
  const { data: result, isLoading, isError } = useGetResult(id, {
    query: {
      enabled: !!id,
      queryKey: getGetResultQueryKey(id),
    }
  });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StudentLayout>
    );
  }

  if (isError || !result) {
    return (
      <StudentLayout>
        <div className="text-center py-20 text-red-500">Failed to load results.</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-6xl mx-auto w-full">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Exam Result: {result.examTitle}</h2>
        </div>

        {/* Score Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-black text-primary mb-2">{result.score} <span className="text-lg text-muted-foreground font-normal">/ {result.totalMarks}</span></div>
              <div className="text-sm font-medium text-primary/80">Total Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold mb-2">{result.accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center gap-4 text-2xl font-bold mb-2">
                <span className="text-green-600">{result.totalCorrect}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-600">{result.totalWrong}</span>
              </div>
              <div className="text-sm text-muted-foreground">Correct / Wrong</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold mb-2">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</div>
              <div className="text-sm text-muted-foreground">Time Taken</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sections">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="sections">Section Analysis</TabsTrigger>
            <TabsTrigger value="questions">Question Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Section Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Correct</TableHead>
                      <TableHead className="text-right">Wrong</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                      <TableHead className="text-right">Accuracy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.sectionResults?.map(sec => (
                      <TableRow key={sec.sectionId}>
                        <TableCell className="font-medium">{sec.sectionName}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{sec.score}</TableCell>
                        <TableCell className="text-right text-green-600">{sec.correct}</TableCell>
                        <TableCell className="text-right text-red-600">{sec.wrong}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{sec.unattempted}</TableCell>
                        <TableCell className="text-right">{sec.accuracy}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="mt-4 space-y-6">
            {result.questionResults?.map((q, idx) => (
              <Card key={q.questionId} className={`border-l-4 ${q.isCorrect ? 'border-l-green-500' : (!q.selectedOption ? 'border-l-gray-300' : 'border-l-red-500')}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{idx + 1}</Badge>
                      {q.sectionName && <Badge variant="secondary">{q.sectionName}</Badge>}
                      
                      {q.isCorrect ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="mr-1 w-3 h-3"/> Correct</Badge>
                      ) : !q.selectedOption ? (
                        <Badge variant="outline" className="text-muted-foreground"><MinusCircle className="mr-1 w-3 h-3"/> Skipped</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="mr-1 w-3 h-3"/> Incorrect</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-medium mb-6 whitespace-pre-wrap break-words">{q.questionText}</p>
                  
                  <div className="space-y-2 mb-6">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const optText = (q as any)[`option${opt}`];
                      if (!optText) return null;
                      
                      const isSelected = q.selectedOption === opt;
                      const isCorrectAnswer = q.correctAnswer === opt;
                      
                      let optClass = "border p-3 rounded-md";
                      if (isCorrectAnswer) {
                        optClass += " bg-green-50 border-green-200 text-green-900 font-medium";
                      } else if (isSelected && !q.isCorrect) {
                        optClass += " bg-red-50 border-red-200 text-red-900";
                      }
                      
                      return (
                        <div key={opt} className={optClass}>
                          <span className="font-bold mr-2">{opt}.</span> {optText}
                          {isCorrectAnswer && <CheckCircle2 className="inline ml-2 w-4 h-4 text-green-600" />}
                          {isSelected && !q.isCorrect && <XCircle className="inline ml-2 w-4 h-4 text-red-600" />}
                        </div>
                      );
                    })}
                  </div>
                  
                  {q.explanation && (
                    <div className="bg-muted p-4 rounded-md text-sm">
                      <span className="font-semibold text-foreground">Explanation:</span>
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
