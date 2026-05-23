import React, { useState } from "react";
import { Link } from "wouter";
import { useGetExams } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Search } from "lucide-react";

export function Exams() {
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetExams({ 
    search: search || undefined, 
    examType: examType !== "ALL" ? examType : undefined,
    page,
    limit: 12
  });

  return (
    <StudentLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Available Exams</h2>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search exams..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={examType} onValueChange={(val) => { setExamType(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="SSC">SSC</SelectItem>
                <SelectItem value="RRB">RRB</SelectItem>
                <SelectItem value="BANKING">Banking</SelectItem>
                <SelectItem value="UPSC">UPSC</SelectItem>
                <SelectItem value="DEFENCE">Defence</SelectItem>
                <SelectItem value="STATE">State Exams</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-[250px] animate-pulse bg-muted" />
            ))}
          </div>
        ) : data?.exams?.length === 0 ? (
          <div className="text-center py-20 bg-muted/50 rounded-lg border border-dashed">
            <h3 className="text-lg font-semibold">No exams found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.exams?.map((exam) => (
                <Card key={exam.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge variant="secondary">{exam.examType}</Badge>
                      <Badge variant="outline" className="font-mono">{exam.totalMarks} Marks</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 leading-tight">{exam.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{exam.description || "No description provided."}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{exam.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{exam.questionCount} questions</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link href={`/exams/${exam.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 font-medium">
                  Page {page} of {data.totalPages}
                </div>
                <Button 
                  variant="outline" 
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
