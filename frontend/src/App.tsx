import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Campaigns from "@/pages/campaigns";
import FacebookAds from "@/pages/facebook-ads";
import Setters from "@/pages/setters";
import Closers from "@/pages/closers";
import Reports from "@/pages/reports";
import AiInsights from "@/pages/ai-insights";
import SlackLog from "@/pages/slack";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["admin", "client"]}>
          <DashboardLayout><Dashboard /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/clients">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout><Clients /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/campaigns">
        <ProtectedRoute allowedRoles={["admin", "client"]}>
          <DashboardLayout><Campaigns /></DashboardLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/facebook-ads">
        <ProtectedRoute allowedRoles={["admin", "client"]}>
          <DashboardLayout><FacebookAds /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/setters">
        <ProtectedRoute allowedRoles={["admin", "setter"]}>
          <DashboardLayout><Setters /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/closers">
        <ProtectedRoute allowedRoles={["admin", "closer"]}>
          <DashboardLayout><Closers /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute allowedRoles={["admin", "client"]}>
          <DashboardLayout><Reports /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/ai-insights">
        <ProtectedRoute allowedRoles={["admin", "client"]}>
          <DashboardLayout><AiInsights /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/slack">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout><SlackLog /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout><Settings /></DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route>
        <DashboardLayout><NotFound /></DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
