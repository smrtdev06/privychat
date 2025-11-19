import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNativeCamera } from "@/hooks/use-native-camera";
import { useToast } from "@/hooks/use-toast";
import { getFullUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { CameraModal } from "@/components/CameraModal";

interface NativeVideoRecorderButtonProps {
  onUploadComplete: (uploadURL: string) => Promise<void>;
  buttonClassName?: string;
  children: React.ReactNode;
  mode?: "record" | "gallery";
}

/**
 * Native video button for Capacitor mobile apps
 * Uses MediaDevices API for recording, file picker for gallery
 */
export function NativeVideoRecorderButton({
  onUploadComplete,
  buttonClassName,
  children,
  mode = "record",
}: NativeVideoRecorderButtonProps) {
  const { selectVideo, isNative } = useNativeCamera();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleCameraCapture = (blob: Blob, filename: string, mimeType: string) => {
    uploadMedia(blob, filename);
  };

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

    // For record mode: show camera modal for true video recording
    if (mode === "record") {
      setShowCameraModal(true);
      return;
    }

    // For gallery mode: use file picker
    setIsUploading(true);
    try {
      console.log(`🎥 Starting video gallery selection...`);
      
      const media = await selectVideo();
      console.log(`🎥 Video selected:`, media.filename, media.blob.size, "bytes");

      await uploadMedia(media.blob, media.filename);
    } catch (error: any) {
      console.error(`❌ Video gallery selection failed:`, error);
      toast({
        title: "Video selection failed",
        description: error.message || "Failed to select video",
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
    <>
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

      {/* Camera Modal for video recording */}
      {mode === "record" && (
        <CameraModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCameraCapture}
          mode="video"
        />
      )}
    </>
  );
}
