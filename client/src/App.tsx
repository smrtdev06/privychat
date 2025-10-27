import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Calculator from "@/pages/calculator";
import Messaging from "@/pages/messaging";
import Settings from "@/pages/settings";
import Conversation from "@/pages/conversation";
import AdminPage from "@/pages/admin";
import VerifyEmail from "@/pages/verify-email";
import ResetPasswordPage from "@/pages/reset-password";
import Help from "@/pages/help";
import About from "@/pages/about";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { useDeepLinks } from "@/hooks/use-deep-links";
import { Capacitor } from "@capacitor/core";
import { CapacitorBridge } from "@/components/capacitor-bridge";

function Router() {
  // Handle deep link URLs for promo code redemption
  useDeepLinks();
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Calculator} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <ProtectedRoute path="/messaging" component={Messaging} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      <Route path="/about" component={About} />
      <ProtectedRoute path="/conversation/:id" component={Conversation} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Check if running in native Capacitor environment
  // If so, use the bridge to load remote app with plugin support
  const isNative = Capacitor.isNativePlatform();
  
  if (isNative) {
    console.log("🚀 Running in native Capacitor - using bridge mode");
    return <CapacitorBridge />;
  }
  
  console.log("🌐 Running in web browser - standard mode");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
