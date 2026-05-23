import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Clock, FileQuestion, ChevronRight, BookOpen, Layers, Play } from "lucide-react";

type TopicMock = {
  id: number;
  title: string;
  subjectName: string | null;
  topicName: string | null;
  duration: number;
  totalMarks: number;
  negativeMarks: number;
  questionCount: number;
  isPublished: boolean;
};

type GroupedMocks = Record<string, { subject: string; topics: Record<string, TopicMock[]> }>;

export default function TopicMocks() {
  const [, setLocation] = useLocation();
  const { token } = useAuth() as any;
  const { toast } = useToast();
  const [mocks, setMocks] = useState<TopicMock[]>([]);
  const [grouped, setGrouped] = useState<GroupedMocks>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const apiBase = import.meta.env.BASE_URL?.replace(/\/$/, "") + "/api";

  useEffect(() => {
    fetchMocks();
  }, []);

  async function fetchMocks() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/topic-mocks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMocks(data.mocks || []);
      setGrouped(data.grouped || {});
      const subjects = Object.keys(data.grouped || {});
      if (subjects.length > 0) setExpandedSubjects(new Set([subjects[0]]));
    } catch {
      toast({ title: "Failed to load topic mocks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function startMock(mockId: number) {
    setStarting(mockId);
    try {
      const res = await fetch(`${apiBase}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ examId: mockId }),
      });
      if (!res.ok) throw new Error("Failed to start");
      const attempt = await res.json();
      setLocation(`/exam/${attempt.id}/take`);
    } catch {
      toast({ title: "Could not start mock test", variant: "destructive" });
    } finally {
      setStarting(null);
    }
  }

  function toggleSubject(subject: string) {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </StudentLayout>
    );
  }

  if (mocks.length === 0) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Topic Mocks Available</h2>
          <p className="text-muted-foreground max-w-sm">
            Topic wise mock tests haven't been published yet. Check back soon!
          </p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Topic Wise Mock Tests</h1>
          <p className="text-muted-foreground mt-1">
            Practice focused topic-wise tests with instant results and explanations
          </p>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(grouped).length}</p>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(grouped).reduce((a, g) => a + Object.keys(g.topics).length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Topics</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <FileQuestion className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{mocks.length}</p>
                <p className="text-sm text-muted-foreground">Mock Tests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped subjects */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([subjectKey, subjectData]) => (
            <Card key={subjectKey} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => toggleSubject(subjectKey)}
              >
                <CardHeader className="pb-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {subjectData.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {Object.keys(subjectData.topics).length} Topics
                      </Badge>
                      <ChevronRight
                        className={`h-5 w-5 text-muted-foreground transition-transform ${expandedSubjects.has(subjectKey) ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                </CardHeader>
              </button>

              {expandedSubjects.has(subjectKey) && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {Object.entries(subjectData.topics).map(([topicKey, topicMocks]) => (
                    <div key={topicKey}>
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        {topicKey}
                        <div className="h-px flex-1 bg-border" />
                      </h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {topicMocks.map((mock) => (
                          <MockCard
                            key={mock.id}
                            mock={mock}
                            isStarting={starting === mock.id}
                            onStart={() => startMock(mock.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}

function MockCard({
  mock,
  isStarting,
  onStart,
}: {
  mock: TopicMock;
  isStarting: boolean;
  onStart: () => void;
}) {
  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold leading-tight">{mock.title}</h4>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {mock.duration} min
          </span>
          <span className="flex items-center gap-1">
            <FileQuestion className="h-3 w-3" /> {mock.questionCount} Qs
          </span>
          {mock.negativeMarks > 0 && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-200">
              -{mock.negativeMarks} neg
            </Badge>
          )}
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={onStart}
          disabled={isStarting}
        >
          <Play className="mr-1 h-3 w-3" />
          {isStarting ? "Starting..." : "Start Mock"}
        </Button>
      </CardContent>
    </Card>
  );
}
