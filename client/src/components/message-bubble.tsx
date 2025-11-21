import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getFullUrl } from "@/lib/queryClient";
import { useState } from "react";

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
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const mediaUrl = message.mediaUrl || '';
  const streamUrl = getMediaStreamUrl(mediaUrl);
  const mimeType = detectMimeType(mediaUrl);
  
  // Debug logging for media URLs
  console.log(`📺 Message ${message.id}:`, {
    messageType: message.messageType,
    mediaUrl,
    streamUrl,
    mimeType
  });
  
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
            {!imageError ? (
              <img
                src={streamUrl}
                alt="Shared image"
                className="w-full h-auto rounded-lg mb-2"
                data-testid={`message-image-${message.id}`}
                crossOrigin="use-credentials"
                onError={(e) => {
                  console.error(`❌ Image load error for ${message.id}:`, e);
                  setImageError(true);
                }}
                onLoad={() => console.log(`✅ Image loaded: ${message.id}`)}
              />
            ) : (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Failed to load image</p>
              </div>
            )}
          </>
        )}

        {message.messageType === "video" && message.mediaUrl && (
          <>
            {!videoError ? (
              <video
                controls
                preload="metadata"
                playsInline
                webkit-playsinline="true"
                crossOrigin="use-credentials"
                className="w-full h-auto rounded-lg mb-2"
                data-testid={`message-video-${message.id}`}
                onError={(e) => {
                  console.error(`❌ Video playback error for ${message.id}:`, e);
                  setVideoError(true);
                }}
                onLoadedMetadata={() => console.log(`✅ Video metadata loaded: ${message.id}`)}
              >
                <source src={streamUrl} type={mimeType || 'video/mp4'} />
                Your browser doesn't support this video format.
              </video>
            ) : (
              <div className="bg-black/10 dark:bg-white/10 rounded-lg p-4 mb-2 text-center">
                <p className="text-sm opacity-75">Video format not supported on this device</p>
                {mimeType.includes('webm') && (
                  <p className="text-xs opacity-60 mt-1">WebM videos are not compatible with iOS</p>
                )}
              </div>
            )}
          </>
        )}

        {message.messageType === "voice" && message.mediaUrl && (
          <audio
            src={getMediaStreamUrl(message.mediaUrl)}
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
