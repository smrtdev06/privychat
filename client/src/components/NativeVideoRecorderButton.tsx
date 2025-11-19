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
 * Supports both recording videos and selecting from gallery
 */
export function NativeVideoRecorderButton({
  onUploadComplete,
  buttonClassName,
  children,
  mode = "record",
}: NativeVideoRecorderButtonProps) {
  const { captureVideo, selectVideo, isNative } = useNativeCamera();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

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
      console.log(`🎥 Starting video ${mode}...`);
      
      // Capture or select video using native camera
      const media = mode === "record" 
        ? await captureVideo()
        : await selectVideo();
      
      console.log(`🎥 Video ${mode === "record" ? "captured" : "selected"}:`, media.filename, media.blob.size, "bytes");

      // Upload to backend proxy
      const formData = new FormData();
      formData.append('file', media.blob, media.filename);

      console.log("📤 Uploading video to proxy...");
      const uploadResponse = await fetch(getFullUrl("/api/objects/upload-proxy"), {
        method: "POST",
        body: formData,
        credentials: "include", // Include session cookie
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
      console.error(`❌ Video ${mode}/upload failed:`, error);
      toast({
        title: "Video upload failed",
        description: error.message || `Failed to ${mode === "record" ? "record" : "select"} or upload video`,
        variant: "destructive",
      });
    } finally {
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
