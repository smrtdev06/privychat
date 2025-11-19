import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNativeCamera } from "@/hooks/use-native-camera";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getFullUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface NativeCameraButtonProps {
  onUploadComplete: (uploadURL: string) => Promise<void>;
  buttonClassName?: string;
  children: React.ReactNode;
  mode?: "photo" | "gallery";
}

/**
 * Native camera button for Capacitor mobile apps
 * Uses Capacitor Camera API to bypass WebView restrictions
 */
export function NativeCameraButton({
  onUploadComplete,
  buttonClassName,
  children,
  mode = "photo",
}: NativeCameraButtonProps) {
  const { capturePhoto, selectPhoto, isNative } = useNativeCamera();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = async () => {
    if (!isNative) {
      toast({
        title: "Not supported",
        description: "Native camera is only available on mobile devices",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log(`📸 Starting ${mode} capture...`);
      
      // Capture or select photo using native camera
      const media = mode === "photo" 
        ? await capturePhoto()
        : await selectPhoto();
      
      console.log(`📸 ${mode} captured:`, media.filename, media.blob.size, "bytes");

      // Upload to backend proxy
      const formData = new FormData();
      formData.append('file', media.blob, media.filename);

      console.log("📤 Uploading to proxy...");
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
      console.error(`❌ ${mode} capture/upload failed:`, error);
      toast({
        title: `${mode === "photo" ? "Photo" : "Image"} upload failed`,
        description: error.message || "Failed to upload media",
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
  );
}
