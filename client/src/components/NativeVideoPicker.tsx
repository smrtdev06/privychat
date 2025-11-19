import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getFullUrl } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface NativeVideoPickerProps {
  onUploadComplete: (uploadURL: string) => Promise<void>;
  buttonClassName?: string;
  children: React.ReactNode;
  maxFileSize?: number;
}

export function NativeVideoPicker({
  onUploadComplete,
  buttonClassName,
  children,
  maxFileSize = 52428800, // 50MB default
}: NativeVideoPickerProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Video must be smaller than ${Math.round(maxFileSize / 1048576)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log("📹 Video selected:", file.name, file.size, "bytes");

      const formData = new FormData();
      formData.append('file', file);

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
      console.log("✅ Video upload successful:", result.uploadURL);

      await onUploadComplete(result.uploadURL);

      toast({
        title: "Upload successful",
        description: "Video uploaded successfully",
      });
    } catch (error: any) {
      console.error("❌ Video upload failed:", error);
      toast({
        title: "Video upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isNative) {
    return null;
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-video-file"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-native-video"
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          children
        )}
      </Button>
    </>
  );
}
