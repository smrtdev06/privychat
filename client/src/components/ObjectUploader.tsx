import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import XHRUpload from "@uppy/xhr-upload";
import Webcam from "@uppy/webcam";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { getFullUrl } from "@/lib/queryClient";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void | Promise<void>;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  allowedFileTypes,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  
  const [uppy] = useState(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes,
      },
      autoProceed: false,
    });

    // Add webcam support
    uppyInstance.use(Webcam, {
      modes: allowedFileTypes?.includes('video/*') 
        ? ['video-audio', 'video-only', 'picture'] 
        : ['picture'],
      mirror: true,
      showRecordingLength: true,
      // Use native camera on mobile devices (iOS/Android)
      mobileNativeCamera: true,
    });

    // Use different upload strategies for web vs mobile
    if (isNative) {
      // Mobile: Upload to backend proxy to avoid CORS issues
      uppyInstance.use(XHRUpload, {
        endpoint: getFullUrl("/api/objects/upload-proxy"),
        method: "POST",
        formData: true, // Send as multipart/form-data
        fieldName: "file", // Form field name for the file
      });
    } else {
      // Web: Upload directly to GCS with signed URL
      uppyInstance.use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      });
    }

    return uppyInstance
      .on("file-added", (file) => {
        console.log("📎 File added:", file.name, file.size, "bytes");
        // Auto-upload when file is added (especially important for mobile camera captures)
        // Add a small delay to ensure file is fully processed
        setTimeout(() => {
          console.log("🎬 Auto-triggering upload for:", file.name);
          uppyInstance.upload();
        }, 100);
      })
      .on("upload", () => {
        console.log("🚀 Upload started");
      })
      .on("upload-progress", (file, progress) => {
        if (progress.bytesTotal) {
          console.log("📊 Upload progress:", file?.name, `${progress.bytesUploaded}/${progress.bytesTotal}`, `(${Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)}%)`);
        }
      })
      .on("upload-success", (file, response) => {
        console.log("✅ Upload success:", file?.name, response);
      })
      .on("upload-error", (file, error) => {
        console.error("❌ Upload error:", file?.name, error);
      })
      .on("complete", async (result) => {
        console.log("🎉 Complete event fired:", result.successful?.length, "successful,", result.failed?.length, "failed");
        try {
          if (onComplete) {
            console.log("⏳ Calling onComplete callback...");
            // @ts-ignore - Uppy type definitions mismatch
            await onComplete(result);
            console.log("✅ onComplete callback finished");
          }
        } catch (error) {
          console.error("❌ Error in upload completion handler:", error);
        } finally {
          console.log("🔒 Closing modal");
          setShowModal(false);
          // Clear all files from Uppy after successful upload
          console.log("🧹 Clearing Uppy state");
          uppyInstance.cancelAll();
        }
      })
      .on("error", (error) => {
        console.error("❌ Uppy error:", error);
      });
  });

  const handleModalClose = () => {
    console.log("🚪 Modal closed - clearing Uppy state");
    uppy.cancelAll();
    setShowModal(false);
  };

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={handleModalClose}
        proudlyDisplayPoweredByUppy={false}
        plugins={['Webcam']}
        note="Use camera or upload from your device"
      />
    </div>
  );
}
