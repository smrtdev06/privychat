import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNativeCamera } from "@/hooks/use-native-camera";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getFullUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { CameraModal } from "@/components/CameraModal";

interface NativeCameraButtonProps {
  onUploadComplete: (uploadURL: string) => Promise<void>;
  buttonClassName?: string;
  children: React.ReactNode;
  mode?: "photo" | "gallery";
}

/**
 * Native camera button for Capacitor mobile apps
 * Uses MediaDevices API for camera, file picker for gallery
 */
export function NativeCameraButton({
  onUploadComplete,
  buttonClassName,
  children,
  mode = "photo",
}: NativeCameraButtonProps) {
  const { selectPhoto, isNative } = useNativeCamera();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleCameraCapture = (blob: Blob, filename: string, mimeType: string) => {
    uploadMedia(blob, filename);
  };

  const uploadMedia = async (blob: Blob, filename: string) => {
    setIsUploading(true);
    try {
      console.log(`📸 Uploading ${filename}:`, blob.size, "bytes");

      // Upload to backend proxy
      const formData = new FormData();
      formData.append('file', blob, filename);

      console.log("📤 Uploading to proxy...");
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
      console.log("✅ Upload successful:", result);

      // Use objectPath if available (mobile), otherwise fall back to uploadURL (web)
      const mediaUrl = result.objectPath || result.uploadURL;
      console.log("📎 Using media URL:", mediaUrl);

      // Call the completion handler
      await onUploadComplete(mediaUrl);

      toast({
        title: "Upload successful",
        description: `${mode === "photo" ? "Photo" : "Image"} uploaded successfully`,
      });
    } catch (error: any) {
      console.error(`❌ Upload failed:`, error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCapture = async () => {
    if (!isNative) {
      toast({
        title: "Not supported",
        description: "Native camera is only available on mobile devices",
        variant: "destructive",
      });
      return;
    }

    // For photo mode: show camera modal for true camera access
    if (mode === "photo") {
      setShowCameraModal(true);
      return;
    }

    // For gallery mode: use file picker
    setIsUploading(true);
    try {
      console.log(`📸 Starting gallery selection...`);
      
      const media = await selectPhoto();
      console.log(`📸 Photo selected:`, media.filename, media.blob.size, "bytes");

      await uploadMedia(media.blob, media.filename);
    } catch (error: any) {
      console.error(`❌ Gallery selection failed:`, error);
      toast({
        title: "Gallery selection failed",
        description: error.message || "Failed to select photo",
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
        onClick={handleCapture}
        className={buttonClassName}
        disabled={isUploading}
        data-testid={`button-native-${mode}`}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          children
        )}
      </Button>

      {/* Camera Modal for photo capture */}
      {mode === "photo" && (
        <CameraModal
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCameraCapture}
          mode="photo"
        />
      )}
    </>
  );
}
