import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import OpportunityDetail from "@/pages/opportunity-detail";
import Profile from "@/pages/profile";
import Leaderboard from "@/pages/leaderboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOpportunities from "@/pages/admin/opportunities-new";
import OpportunityForm from "@/pages/admin/opportunity-form";
import Applications from "@/pages/admin/applications";
import Analytics from "@/pages/admin/analytics";
import StudentDashboard from "@/pages/student/dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/opportunity/:id" component={OpportunityDetail} />
          <Route path="/dashboard" component={StudentDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/opportunities" component={AdminOpportunities} />
          <Route path="/admin/opportunities/new" component={OpportunityForm} />
          <Route path="/admin/opportunities/:id/edit" component={OpportunityForm} />
          <Route path="/admin/applications/:opportunityId" component={Applications} />
          <Route path="/admin/analytics" component={Analytics} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
