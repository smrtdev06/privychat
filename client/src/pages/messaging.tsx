import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Settings, ArrowRight } from "lucide-react";
import ConversationList from "@/components/conversation-list";
import { useSwipeHandler } from "@/lib/swipe-handler";
import { useAuth } from "@/hooks/use-auth";

export default function Messaging() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  useSwipeHandler((direction) => {
    if (direction === "right") {
      setLocation("/");
    }
  });

  const handleNewConversation = () => {
    const userCode = prompt("Enter recipient's user code:");
    if (userCode) {
      // Create conversation and navigate to it
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userCode: userCode.trim() }),
      })
        .then(res => res.json())
        .then(conversation => {
          setLocation(`/conversation/${conversation.id}`);
        })
        .catch(error => {
          alert("Error starting conversation. Please check the user code.");
        });
    }
  };

  const remainingMessages = user?.subscriptionType === "premium" ? "Unlimited" : 
    (1 - (user?.dailyMessageCount || 0));

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold">Secure Messages</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleNewConversation}
            data-testid="button-new-conversation"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setLocation("/settings")}
            data-testid="button-settings-messaging"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Swipe Indicator */}
      <div className="bg-blue-100 text-blue-800 px-4 py-2 text-sm flex items-center">
        <ArrowRight className="h-4 w-4 mr-2" />
        Swipe right to quickly return to calculator
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
        ) : (
          <ConversationList conversations={conversations as any} />
        )}
      </div>

      {/* Messages Remaining */}
      {user?.subscriptionType === "free" && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4 text-center">
          <p className="text-sm text-yellow-700">
            Messages remaining today: <strong>{remainingMessages}</strong> |{" "}
            <button
              onClick={() => setLocation("/settings")}
              className="text-primary hover:underline ml-1"
              data-testid="link-upgrade"
            >
              Upgrade to Premium
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
