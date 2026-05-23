import React from "react";
import { Link } from "wouter";
import { useGetMyAnalytics, getGetMyAnalyticsQueryKey } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Target, History } from "lucide-react";

export function Dashboard() {
  const { data: analytics, isLoading } = useGetMyAnalytics();

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-96" />
            <Skeleton className="col-span-3 h-96" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <Button asChild>
            <Link href="/exams">Browse Exams</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalAttempts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageScore?.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.averageAccuracy?.toFixed(1) || "0.0"}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor((analytics?.totalTimeSpent || 0) / 60)} mins</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
              <CardDescription>Your most recent exam attempts.</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentAttempts?.length ? (
                <div className="space-y-4">
                  {analytics.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{attempt.examTitle}</div>
                        <div className="text-sm text-muted-foreground">{new Date(attempt.submittedAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{attempt.score} pts</div>
                        <div className="text-sm text-muted-foreground">{attempt.accuracy}% acc</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No recent attempts. Go take an exam!
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Strong & Weak Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Strong Areas</h4>
                  {analytics?.strongAreas?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {analytics.strongAreas.map(area => (
                        <span key={area} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">{area}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not enough data yet.</div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Areas for Improvement</h4>
                  {analytics?.weakAreas?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {analytics.weakAreas.map(area => (
                        <span key={area} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">{area}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Not enough data yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
