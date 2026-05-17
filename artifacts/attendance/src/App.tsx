import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AttendancePage from "@/pages/attendance";
import EmployeesPage from "@/pages/employees";
import LeavesPage from "@/pages/leaves";
import OvertimePage from "@/pages/overtime";
import AnnouncementsPage from "@/pages/announcements";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

// Wire up the auth token getter so every API call includes Bearer token
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
    mutations: { retry: 0 },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">جاري التحميل...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { employee, token, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!token || !employee) return <Redirect to="/login" />;
  if (roles && !roles.includes(employee.role)) return <Redirect to="/attendance" />;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRouter() {
  const { token, employee, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} roles={["admin", "manager"]} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={EmployeesPage} roles={["admin", "manager"]} />
      </Route>
      <Route path="/leaves">
        <ProtectedRoute component={LeavesPage} />
      </Route>
      <Route path="/overtime">
        <ProtectedRoute component={OvertimePage} />
      </Route>
      <Route path="/announcements">
        <ProtectedRoute component={AnnouncementsPage} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} roles={["admin", "manager"]} />
      </Route>
      <Route path="/">
        {() => {
          if (isLoading) return <LoadingScreen />;
          if (!token) return <Redirect to="/login" />;
          if (employee?.role === "admin" || employee?.role === "manager") return <Redirect to="/dashboard" />;
          return <Redirect to="/attendance" />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
