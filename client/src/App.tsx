import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-stone-900">
      <div className="max-w-md w-full px-6 text-center">
        <h1 className="text-4xl font-bold mb-4 text-stone-800">Coffee Journal</h1>
        <p className="mb-8 text-stone-600 text-lg">
          Track your brewing journey, one cup at a time.
        </p>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
          <Button 
            className="w-full py-6 text-lg" 
            onClick={() => window.location.href = "/api/auth/google"}
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    // Don't retry on 401s, just show login
    retry: false,
  });

  if (isLoading) return null;

  if (!user) {
    return <LoginScreen />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
