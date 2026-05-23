import React from "react";
import { Link } from "wouter";
import { useGetMyAttempts } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Attempts() {
  const { data: attempts, isLoading } = useGetMyAttempts();

  return (
    <StudentLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Attempt History</h2>

        <Card>
          <CardHeader>
            <CardTitle>All Past Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !attempts || attempts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                You haven't attempted any exams yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Accuracy</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(attempt.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{attempt.examTitle}</TableCell>
                      <TableCell><Badge variant="outline">{attempt.examType}</Badge></TableCell>
                      <TableCell className="text-right font-bold">{attempt.score}</TableCell>
                      <TableCell className="text-right">{attempt.accuracy}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/results/${attempt.id}`}>View Result</Link>
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
    </StudentLayout>
  );
}
