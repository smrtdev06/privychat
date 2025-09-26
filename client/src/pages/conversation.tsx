import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Image, Send, MoreVertical } from "lucide-react";
import MessageBubble from "@/components/message-bubble";
import { useSwipeHandler } from "@/lib/swipe-handler";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", id, "messages"],
    enabled: !!id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const conversation = (conversations as any[]).find((c: any) => c.id === id);

  useSwipeHandler((direction) => {
    if (direction === "right") {
      setLocation("/");
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content?: string; messageType: string; mediaUrl?: string }) => {
      if (!id) {
        throw new Error("No conversation ID available");
      }
      return await apiRequest("POST", "/api/messages", {
        conversationId: id,
        ...messageData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      content: messageText.trim(),
      messageType: "text",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSendMessage = user?.subscriptionType === "premium" || 
    (user?.dailyMessageCount || 0) < 1;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20 mr-3"
          onClick={() => setLocation("/messaging")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h3 className="font-semibold" data-testid="conversation-title">
            {conversation?.otherUser?.username || "Unknown User"}
          </h3>
          <p className="text-sm text-primary-foreground/80">
            {conversation?.otherUser?.userCode}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
        {(messages as any[]).map((message: any) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === user?.id}
          />
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted"
            data-testid="button-camera"
          >
            <Camera className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted"
            data-testid="button-image"
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[2.5rem] max-h-24 resize-none"
              rows={1}
              disabled={!canSendMessage}
              data-testid="input-message"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || !canSendMessage}
            className="rounded-full"
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Message Limit Warning */}
        {user?.subscriptionType === "free" && (
          <div className="mt-2 text-center">
            <p className="text-sm text-yellow-600">
              {canSendMessage 
                ? "This will use your last free message today"
                : "Daily message limit reached. Upgrade to premium for unlimited messages."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
