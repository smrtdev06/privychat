import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Image, Send, MoreVertical, Settings, HelpCircle, Info } from "lucide-react";
import MessageBubble from "@/components/message-bubble";
import { useSwipeHandler } from "@/lib/swipe-handler";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Conversation() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", id, "messages"],
    enabled: !!id,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const conversation = (conversations as any[]).find((c: any) => c.id === id);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((newMessage: any) => {
    // Add new message to the cache optimistically
    queryClient.setQueryData(["/api/conversations", id, "messages"], (oldMessages: any) => {
      // Check if message already exists to avoid duplicates
      const exists = oldMessages?.some((msg: any) => msg.id === newMessage.id);
      if (exists) return oldMessages;
      return [...(oldMessages || []), newMessage];
    });
  }, [queryClient, id]);

  // Setup WebSocket connection
  useWebSocket(id, user?.id, handleWebSocketMessage);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useSwipeHandler((direction) => {
    if (direction === "right" || direction === "left") {
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
    },
    onError: (error: any, variables) => {
      // Restore the message text on error so user can retry
      if (variables.content) {
        setMessageText(variables.content);
      }
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || isSubmittingRef.current) return;
    
    // Prevent duplicate submissions
    isSubmittingRef.current = true;
    const messageToSend = messageText.trim();
    
    // Clear input immediately to prevent re-submission
    setMessageText("");

    sendMessageMutation.mutate({
      content: messageToSend,
      messageType: "text",
    }, {
      onSettled: () => {
        // Re-enable submissions after request completes
        isSubmittingRef.current = false;
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMediaUpload = async (mediaUrl: string, messageType: "image" | "video") => {
    try {
      // Set ACL policy for the uploaded media
      const response = await apiRequest("PUT", "/api/media", { mediaUrl });
      const objectPath = response.objectPath;

      // Send message with media URL
      sendMessageMutation.mutate({
        messageType,
        mediaUrl: objectPath,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    }
  };

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const canSendMessage = user?.subscriptionType === "premium" || 
    (user?.dailyMessageCount || 0) < 1;

  if (isLoading || conversationsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div>Loading conversation...</div>
      </div>
    );
  }

  // If conversation not found after loading, show error
  if (!conversation && !conversationsLoading) {
    console.error("Conversation not found - ID:", id, "Available conversations:", conversations);
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-destructive mb-4">Conversation not found</p>
          <Button onClick={() => setLocation("/messaging")}>Back to Messages</Button>
        </div>
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-more"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation("/settings")} data-testid="menu-settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/help")} data-testid="menu-help">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/about")} data-testid="menu-about">
              <Info className="h-4 w-4 mr-2" />
              About
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-3">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10485760} // 10MB
            onGetUploadParameters={getUploadParameters}
            onComplete={(result) => {
              const uploadedFile = result.successful?.[0];
              if (uploadedFile?.uploadURL) {
                handleMediaUpload(uploadedFile.uploadURL, "image");
              }
            }}
            buttonClassName="p-0 h-10 w-10 text-muted-foreground hover:bg-muted"
          >
            <Camera className="h-5 w-5" data-testid="button-camera" />
          </ObjectUploader>
          
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={52428800} // 50MB for videos
            onGetUploadParameters={getUploadParameters}
            onComplete={(result) => {
              const uploadedFile = result.successful?.[0];
              if (uploadedFile?.uploadURL) {
                // Determine if it's an image or video based on file type
                const fileType = uploadedFile.type || "";
                const messageType = fileType.startsWith("video/") ? "video" : "image";
                handleMediaUpload(uploadedFile.uploadURL, messageType);
              }
            }}
            buttonClassName="p-0 h-10 w-10 text-muted-foreground hover:bg-muted"
          >
            <Image className="h-5 w-5" data-testid="button-image" />
          </ObjectUploader>
          
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
