import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Settings, HelpCircle, LogOut, User, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function NavigationMenu() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleNavigate = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  const handleLogout = () => {
    setOpen(false);
    logoutMutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {/* User Info */}
          {user && (
            <div className="px-3 py-4 mb-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscriptionType === "premium"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  }`}
                >
                  {user.subscriptionType === "premium" ? "Premium" : "Free Plan"}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigate("/messaging")}
            data-testid="menu-messaging"
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            Messages
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigate("/settings")}
            data-testid="menu-settings"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleNavigate("/help")}
            data-testid="menu-help"
          >
            <HelpCircle className="h-5 w-5 mr-3" />
            Help & Support
          </Button>

          <div className="my-4 border-t border-border" />

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            data-testid="menu-logout"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
