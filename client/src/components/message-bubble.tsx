import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getFullUrl } from "@/lib/queryClient";
import { useState } from "react";
import { useMediaUrl } from "@/hooks/use-media-url";

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

function getMediaStreamUrl(mediaUrl: string): string {
  const baseUrl = getFullUrl("");
  return `${baseUrl}/api/objects/stream?path=${encodeURIComponent(mediaUrl)}`;
}

function detectMimeType(url: string): string {
  const lowerUrl = url.toLowerCase();
  
  // Video types
  if (lowerUrl.includes('.mp4')) return 'video/mp4';
  if (lowerUrl.includes('.webm')) return 'video/webm';
  if (lowerUrl.includes('.mov')) return 'video/quicktime';
  if (lowerUrl.includes('.m4v')) return 'video/x-m4v';
  
  // Image types
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
  if (lowerUrl.includes('.png')) return 'image/png';
  if (lowerUrl.includes('.gif')) return 'image/gif';
  if (lowerUrl.includes('.webp')) return 'image/webp';
  
  // Audio types
  if (lowerUrl.includes('.mp3')) return 'audio/mpeg';
  if (lowerUrl.includes('.wav')) return 'audio/wav';
  if (lowerUrl.includes('.m4a')) return 'audio/mp4';
  if (lowerUrl.includes('.ogg')) return 'audio/ogg';
  
  return '';
}

export default function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const mediaUrl = message.mediaUrl || '';
  const mimeType = detectMimeType(mediaUrl);
  
  // Use iOS-compatible media URLs
  const imageMedia = useMediaUrl(
    message.messageType === 'image' ? message.mediaUrl : undefined,
    'image'
  );
  const videoMedia = useMediaUrl(
    message.messageType === 'video' ? message.mediaUrl : undefined,
    'video'
  );
  const voiceMedia = useMediaUrl(
    message.messageType === 'voice' ? message.mediaUrl : undefined,
    'voice'
  );
  
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
          <>
            {imageMedia.loading ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Loading image...</p>
              </div>
            ) : imageMedia.error || !imageMedia.url ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Failed to load image</p>
              </div>
            ) : (
              <img
                src={imageMedia.url}
                alt="Shared image"
                className="w-full h-auto rounded-lg mb-2"
                data-testid={`message-image-${message.id}`}
              />
            )}
          </>
        )}

        {message.messageType === "video" && message.mediaUrl && (
          <>
            {videoMedia.loading ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Loading video...</p>
              </div>
            ) : videoMedia.error || !videoMedia.url ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Failed to load video</p>
                {mimeType.includes('webm') && (
                  <p className="text-xs opacity-60 mt-1">WebM videos are not compatible with iOS</p>
                )}
              </div>
            ) : (
              <video
                src={videoMedia.url}
                controls
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                className="w-full h-auto rounded-lg mb-2"
                data-testid={`message-video-${message.id}`}
              />
            )}
          </>
        )}

        {message.messageType === "voice" && message.mediaUrl && (
          <>
            {voiceMedia.loading ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-2 mb-2 text-center">
                <p className="text-xs opacity-75">Loading audio...</p>
              </div>
            ) : voiceMedia.error || !voiceMedia.url ? (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-2 mb-2 text-center">
                <p className="text-xs opacity-75">Failed to load audio</p>
              </div>
            ) : (
              <audio
                src={voiceMedia.url}
                controls
                className="w-full mb-2"
                data-testid={`message-voice-${message.id}`}
              />
            )}
          </>
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
