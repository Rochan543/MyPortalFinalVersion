import React from "react";
import { useGetAdminAnalytics } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AdminAnalytics() {
  const { data: analytics, isLoading } = useGetAdminAnalytics();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Daily Active Users Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Active users and attempts over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {analytics?.userActivityByDay && analytics.userActivityByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.userActivityByDay}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {weekday: 'short'})}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="attempts" name="Attempts" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exam Type Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Distribution</CardTitle>
              <CardDescription>Breakdown of exams by category.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                {analytics?.examTypeDistribution && analytics.examTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.examTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="examType"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.examTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Most Attempted Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {analytics?.mostAttemptedExams && analytics.mostAttemptedExams.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.mostAttemptedExams} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis type="category" dataKey="examTitle" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} cursor={{fill: 'hsl(var(--muted)/0.2)'}} />
                      <Bar dataKey="attemptCount" name="Total Attempts" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hardest Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Hardest Questions</CardTitle>
              <CardDescription>Questions with the highest failure rate.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.hardestQuestions && analytics.hardestQuestions.length > 0 ? (
                  analytics.hardestQuestions.slice(0, 4).map((q, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate pr-4">{q.questionText}</span>
                        <span className="text-red-500 font-bold whitespace-nowrap">{q.wrongRate}% Fail</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${q.wrongRate}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-muted-foreground text-sm">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
