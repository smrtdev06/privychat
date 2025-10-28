import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getFullUrl } from "@/lib/queryClient";

interface MessageBubbleProps {
  message: {
    id: string;
    content?: string;
    messageType: string;
    mediaUrl?: string;
    createdAt: string;
    sender: {
      username: string;
    };
  };
  isOwnMessage: boolean;
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
          isOwnMessage
            ? "bg-primary text-primary-foreground ml-auto"
            : "bg-muted text-muted-foreground mr-auto"
        )}
        data-testid={`message-${message.id}`}
      >
        {message.messageType === "image" && message.mediaUrl && (
          <img
            src={getFullUrl(message.mediaUrl)}
            alt="Shared image"
            className="w-full h-auto rounded-lg mb-2"
            data-testid={`message-image-${message.id}`}
          />
        )}

        {message.messageType === "video" && message.mediaUrl && (
          <video
            src={getFullUrl(message.mediaUrl)}
            controls
            className="w-full h-auto rounded-lg mb-2"
            data-testid={`message-video-${message.id}`}
          />
        )}

        {message.messageType === "voice" && message.mediaUrl && (
          <audio
            src={getFullUrl(message.mediaUrl)}
            controls
            className="w-full mb-2"
            data-testid={`message-voice-${message.id}`}
          />
        )}
        
        {message.content && (
          <p className="text-sm" data-testid={`message-content-${message.id}`}>
            {message.content}
          </p>
        )}
        
        <p className="text-xs opacity-75 mt-1" data-testid={`message-time-${message.id}`}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
