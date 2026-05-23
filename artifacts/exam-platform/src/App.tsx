import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";

// Student Pages
import { Dashboard } from "@/pages/student/Dashboard";
import { Exams } from "@/pages/student/Exams";
import { ExamDetail } from "@/pages/student/ExamDetail";
import { ExamTake } from "@/pages/student/ExamTake";
import { Results } from "@/pages/student/Results";
import { Analytics } from "@/pages/student/Analytics";
import { Attempts } from "@/pages/student/Attempts";
import { Bookmarks } from "@/pages/student/Bookmarks";
import TopicMocks from "./pages/student/TopicMocks";
import Resources from "./pages/student/Resources";
import PreviousPapers from "./pages/student/PreviousPapers";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminExams } from "@/pages/admin/Exams";
import { AdminExamQuestions } from "@/pages/admin/ExamQuestions";
import { AdminUploadPdf } from "@/pages/admin/UploadPdf";
import { AdminUsers } from "@/pages/admin/Users";
import { AdminAnalytics } from "@/pages/admin/Analytics";
import AdminTopicMocksPage from "@/pages/admin/topic-mocks";
import AdminResources from "@/pages/admin/Resources";
import AdminPreviousPapers from "@/pages/admin/PreviousPapers";

// Route Guards
const ProtectedRoute = ({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated || !user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={user.role === "ADMIN" ? "/admin" : "/dashboard"} />;
  }
  return <Component />;
};

const PublicRoute = ({ component: Component }: { component: any }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (isAuthenticated && user) {
    return <Redirect to={user.role === "ADMIN" ? "/admin" : "/dashboard"} />;
  }
  return <Component />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Home} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />

      {/* Student Routes */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} allowedRoles={["STUDENT"]} />} />
      <Route path="/exams" component={() => <ProtectedRoute component={Exams} allowedRoles={["STUDENT"]} />} />
      <Route path="/exams/:examId" component={() => <ProtectedRoute component={ExamDetail} allowedRoles={["STUDENT"]} />} />
      <Route path="/exam/:attemptId/take" component={() => <ProtectedRoute component={ExamTake} allowedRoles={["STUDENT"]} />} />
      <Route path="/results/:attemptId" component={() => <ProtectedRoute component={Results} allowedRoles={["STUDENT"]} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} allowedRoles={["STUDENT"]} />} />
      <Route path="/attempts" component={() => <ProtectedRoute component={Attempts} allowedRoles={["STUDENT"]} />} />
      <Route path="/bookmarks" component={() => <ProtectedRoute component={Bookmarks} allowedRoles={["STUDENT"]} />} />
      <Route path="/topic-mocks" component={() => <ProtectedRoute component={TopicMocks} allowedRoles={["STUDENT"]} />} />
      <Route path="/resources" component={() => <ProtectedRoute component={Resources} allowedRoles={["STUDENT"]} />} />
      <Route path="/previous-papers" component={() => <ProtectedRoute component={PreviousPapers} allowedRoles={["STUDENT"]} />} />

      {/* Admin Routes */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminDashboard} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/exams" component={() => <ProtectedRoute component={AdminExams} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/exams/:examId/questions" component={() => <ProtectedRoute component={AdminExamQuestions} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/upload" component={() => <ProtectedRoute component={AdminUploadPdf} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/analytics" component={() => <ProtectedRoute component={AdminAnalytics} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/topic-mocks" component={() => <ProtectedRoute component={AdminTopicMocksPage} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/resources" component={() => <ProtectedRoute component={AdminResources} allowedRoles={["ADMIN"]} />} />
      <Route path="/admin/previous-papers" component={() => <ProtectedRoute component={AdminPreviousPapers} allowedRoles={["ADMIN"]} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
