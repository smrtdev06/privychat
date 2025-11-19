import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Image, Video, Send, MoreVertical, Settings, HelpCircle, Info } from "lucide-react";
import MessageBubble from "@/components/message-bubble";
import { useSwipeHandler } from "@/lib/swipe-handler";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { ObjectUploader } from "@/components/ObjectUploader";
import { NativeCameraButton } from "@/components/NativeCameraButton";
import { NativeVideoPicker } from "@/components/NativeVideoPicker";
import { NativeVideoRecorderButton } from "@/components/NativeVideoRecorderButton";
import { Capacitor } from "@capacitor/core";
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
  const isNative = Capacitor.isNativePlatform();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/conversations", id, "messages"],
    enabled: !!id,
    refetchOnMount: 'always', // Always refetch when navigating back to conversation
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
      // Set ACL policy for the uploaded media (grant access to both conversation participants)
      const response = await apiRequest("PUT", "/api/media", { 
        mediaUrl,
        conversationId: id 
      });
      const objectPath = response.objectPath;

      // Send message with media URL and wait for completion
      await sendMessageMutation.mutateAsync({
        messageType,
        mediaUrl: objectPath,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
      throw error; // Re-throw so the modal knows the upload failed
    }
  };

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  // Check if either user has premium (matches backend logic)
  const userIsPremium = user?.subscriptionType === "premium";
  const otherUserIsPremium = conversation?.otherUser?.subscriptionType === "premium";
  const canSendMessage = userIsPremium || otherUserIsPremium || (user?.dailyMessageCount || 0) < 1;

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
      <div className="bg-primary text-primary-foreground p-4 flex items-center safe-area-top">
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
            {conversation?.otherUser?.fullName || conversation?.otherUser?.userCode || "Unknown User"}
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
      <div className="border-t border-border p-3 safe-area-bottom">
        {/* Row 1: Media buttons */}
        <div className="flex items-center space-x-2 mb-2">
          {/* Native camera buttons for mobile apps */}
          {isNative ? (
            <>
              <NativeCameraButton
                mode="photo"
                onUploadComplete={async (uploadURL) => {
                  await handleMediaUpload(uploadURL, "image");
                }}
                buttonClassName="flex items-center justify-center h-9 w-9 min-w-9 rounded-md bg-transparent border-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Camera className="h-5 w-5" data-testid="button-camera" />
              </NativeCameraButton>
              
              <NativeCameraButton
                mode="gallery"
                onUploadComplete={async (uploadURL) => {
                  await handleMediaUpload(uploadURL, "image");
                }}
                buttonClassName="flex items-center justify-center h-9 w-9 min-w-9 rounded-md bg-transparent border-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Image className="h-5 w-5" data-testid="button-image" />
              </NativeCameraButton>
              
              <NativeVideoRecorderButton
                onUploadComplete={async (uploadURL) => {
                  await handleMediaUpload(uploadURL, "video");
                }}
                buttonClassName="flex items-center justify-center h-9 w-9 min-w-9 rounded-md bg-transparent border-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Video className="h-5 w-5" data-testid="button-video-record" />
              </NativeVideoRecorderButton>
            </>
          ) : (
            /* Web uploader with Uppy */
            <>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={52428800} // 50MB for videos
                allowedFileTypes={['video/*']}
                onGetUploadParameters={getUploadParameters}
                onComplete={async (result) => {
                  const uploadedFile = result.successful?.[0];
                  const uploadURL = uploadedFile?.uploadURL as string | undefined;
                  if (uploadURL) {
                    await handleMediaUpload(uploadURL, "video");
                  }
                }}
                buttonClassName="flex items-center justify-center h-9 w-9 min-w-9 rounded-md bg-transparent border-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Camera className="h-5 w-5" data-testid="button-camera" />
              </ObjectUploader>
              
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760} // 10MB
                allowedFileTypes={['image/*']}
                onGetUploadParameters={getUploadParameters}
                onComplete={async (result) => {
                  const uploadedFile = result.successful?.[0];
                  const uploadURL = uploadedFile?.uploadURL as string | undefined;
                  if (uploadURL) {
                    await handleMediaUpload(uploadURL, "image");
                  }
                }}
                buttonClassName="flex items-center justify-center h-9 w-9 min-w-9 rounded-md bg-transparent border-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Image className="h-5 w-5" data-testid="button-image" />
              </ObjectUploader>
            </>
          )}
        </div>

        {/* Row 2: Input field and send button */}
        <div className="flex items-end space-x-2">
          <div className="flex-1 min-w-0">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[2.5rem] max-h-24 resize-none w-full"
              rows={1}
              disabled={!canSendMessage}
              data-testid="input-message"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || !canSendMessage}
            className="rounded-full h-9 w-9 min-w-9 p-0"
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Message Limit Warning - only show when BOTH users are free */}
        {user?.subscriptionType === "free" && !otherUserIsPremium && (
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
