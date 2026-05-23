import React from "react";
import { useGetBookmarks, useToggleBookmark } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { BookmarkMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Bookmarks() {
  const { data, isLoading } = useGetBookmarks();
  const toggleMutation = useToggleBookmark();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRemove = (questionId: number) => {
    toggleMutation.mutate(
      { data: { questionId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/student/bookmarks"] });
          toast({ title: "Bookmark removed" });
        }
      }
    );
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Saved Questions</h2>
        <p className="text-muted-foreground">Review questions you've bookmarked during exams.</p>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-1">No bookmarks yet</p>
                <p className="text-sm">Questions you bookmark during an exam will appear here for later review.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((q) => (
              <Card key={q.id}>
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{q.questionType}</Badge>
                      <Badge variant="secondary">Marks: {q.marks}</Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(q.id)}
                    title="Remove bookmark"
                  >
                    <BookmarkMinus className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-lg mb-4">{q.questionText}</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
                    <div className={`p-2 rounded border ${q.correctAnswer === 'A' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>A. {q.optionA}</div>
                    <div className={`p-2 rounded border ${q.correctAnswer === 'B' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>B. {q.optionB}</div>
                    <div className={`p-2 rounded border ${q.correctAnswer === 'C' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>C. {q.optionC}</div>
                    <div className={`p-2 rounded border ${q.correctAnswer === 'D' ? 'bg-green-50 border-green-200 font-medium' : ''}`}>D. {q.optionD}</div>
                  </div>
                  {q.explanation && (
                    <div className="bg-muted p-3 rounded text-sm mt-4">
                      <span className="font-semibold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
