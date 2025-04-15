import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AccountsPage from "@/pages/accounts-page";
import AiAssistantPage from "@/pages/ai-assistant-page";
import GoalsPage from "@/pages/goals-page";
import JournalPage from "@/pages/journal-page";
import SettingsPage from "@/pages/settings-page";
import MoodPage from "@/pages/mood-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/accounts" component={AccountsPage} />
      <ProtectedRoute path="/ai-assistant" component={AiAssistantPage} />
      <ProtectedRoute path="/goals" component={GoalsPage} />
      <ProtectedRoute path="/journal" component={JournalPage} />
      <ProtectedRoute path="/mood" component={MoodPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
