import React from "react";
import { useGetMyAnalytics } from "@workspace/api-client-react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

export function Analytics() {
  const { data: analytics, isLoading } = useGetMyAnalytics();

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Performance Analytics</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Score History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
              <CardDescription>Your performance over time.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {analytics?.scoreHistory && analytics.scoreHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Accuracy by subject/exam type.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {analytics?.subjectPerformance && analytics.subjectPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="subject" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                        formatter={(value) => [`${value}%`, 'Accuracy']}
                      />
                      <Bar 
                        dataKey="accuracy" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
