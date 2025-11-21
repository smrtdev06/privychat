import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNativeCamera } from "@/hooks/use-native-camera";
import { useToast } from "@/hooks/use-toast";
import { getFullUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface NativeVideoRecorderButtonProps {
  onUploadComplete: (uploadURL: string) => Promise<void>;
  buttonClassName?: string;
  children: React.ReactNode;
  mode?: "record" | "gallery";
}

/**
 * Native video button for Capacitor mobile apps
 * Uses Capacitor Camera API with VIDEO mode to trigger native camera app
 * This ensures iOS records in proper MP4/MOV format that plays on all devices
 */
export function NativeVideoRecorderButton({
  onUploadComplete,
  buttonClassName,
  children,
  mode = "record",
}: NativeVideoRecorderButtonProps) {
  const { selectVideo, captureVideo, isNative } = useNativeCamera();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadMedia = async (blob: Blob, filename: string) => {
    setIsUploading(true);
    try {
      console.log(`🎥 Uploading ${filename}:`, blob.size, "bytes");

      // Upload to backend proxy
      const formData = new FormData();
      formData.append('file', blob, filename);

      console.log("📤 Uploading video to proxy...");
      const uploadResponse = await fetch(getFullUrl("/api/objects/upload-proxy"), {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      console.log("✅ Video upload successful:", result);

      // Use objectPath if available (mobile), otherwise fall back to uploadURL (web)
      const mediaUrl = result.objectPath || result.uploadURL;
      console.log("📎 Using media URL:", mediaUrl);

      // Call the completion handler
      await onUploadComplete(mediaUrl);

      toast({
        title: "Upload successful",
        description: "Video uploaded successfully",
      });
    } catch (error: any) {
      console.error(`❌ Video upload failed:`, error);
      toast({
        title: "Video upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecord = async () => {
    if (!isNative) {
      toast({
        title: "Not supported",
        description: `Native video ${mode === "record" ? "recording" : "selection"} is only available on mobile devices`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      let media: { blob: Blob; filename: string; mimeType: string };
      
      if (mode === "record") {
        // For record mode: use native camera API to record video
        console.log(`🎥 Starting native video recording...`);
        media = await captureVideo();
        console.log(`🎥 Video recorded:`, media.filename, media.blob.size, "bytes", media.mimeType);
      } else {
        // For gallery mode: use file picker
        console.log(`🎥 Starting video gallery selection...`);
        media = await selectVideo();
        console.log(`🎥 Video selected:`, media.filename, media.blob.size, "bytes");
      }

      await uploadMedia(media.blob, media.filename);
    } catch (error: any) {
      console.error(`❌ Video ${mode === "record" ? "recording" : "selection"} failed:`, error);
      toast({
        title: `Video ${mode === "record" ? "recording" : "selection"} failed`,
        description: error.message || `Failed to ${mode === "record" ? "record" : "select"} video`,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  // Don't render if not on native platform
  if (!isNative) {
    return null;
  }

  return (
    <Button
      onClick={handleRecord}
      className={buttonClassName}
      disabled={isUploading}
      data-testid={`button-native-video-${mode}`}
    >
      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        children
      )}
    </Button>
  );
}
