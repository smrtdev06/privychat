import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Circle, Square, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface VideoRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordComplete: (blob: Blob, filename: string) => void;
}

/**
 * Video recording modal using Capacitor Community Video Recorder plugin
 * Shows native camera preview with record/stop controls
 */
export function VideoRecordModal({ isOpen, onClose, onRecordComplete }: VideoRecordModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Timer effect
  useEffect(() => {
    if (!isRecording) {
      setRecordingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen || !isNative) return;

    let isActive = true;

    const initCamera = async () => {
      try {
        const { VideoRecorder } = await import('@capacitor-community/video-recorder');
        
        await VideoRecorder.initialize({
          camera: 0, // Back camera
          previewFrames: [{
            id: 'video-record',
            stackPosition: 'back',
            width: 'fill',
            height: 'fill',
            x: 0,
            y: 0,
            borderRadius: 0
          }]
        });

        console.log('✅ VideoRecorder initialized');
      } catch (err: any) {
        if (isActive) {
          console.error('Failed to initialize camera:', err);
          setError(err.message || 'Failed to initialize camera');
        }
      }
    };

    initCamera();

    return () => {
      isActive = false;
      // Cleanup camera when modal closes
      const cleanup = async () => {
        try {
          const { VideoRecorder } = await import('@capacitor-community/video-recorder');
          await VideoRecorder.destroy();
          console.log('✅ VideoRecorder destroyed');
        } catch (err) {
          console.error('Failed to cleanup camera:', err);
        }
      };
      cleanup();
    };
  }, [isOpen, isNative]);

  const startRecording = async () => {
    try {
      const { VideoRecorder } = await import('@capacitor-community/video-recorder');
      await VideoRecorder.startRecording();
      setIsRecording(true);
      console.log('🎥 Recording started');
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      const { VideoRecorder } = await import('@capacitor-community/video-recorder');
      const { Filesystem } = await import('@capacitor/filesystem');

      console.log('🛑 Stopping recording...');
      const result = await VideoRecorder.stopRecording();
      setIsRecording(false);

      if (!result.videoUrl) {
        throw new Error('No video file returned');
      }

      console.log('✅ Recording stopped, video URL:', result.videoUrl);

      // Read the video file
      const videoPath = result.videoUrl.replace('file://', '');
      const videoFile = await Filesystem.readFile({
        path: videoPath
      });

      // Convert base64 to Blob
      const base64Data = typeof videoFile.data === 'string' ? videoFile.data : '';
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'video/mp4' });
      const filename = `video-${Date.now()}.mp4`;

      console.log('✅ Video converted to blob:', filename, blob.size, 'bytes');

      onRecordComplete(blob, filename);
      onClose();
    } catch (err: any) {
      console.error('Failed to stop recording:', err);
      setError(err.message || 'Failed to stop recording');
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      // If recording, stop first
      stopRecording();
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isNative) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full h-full max-w-none p-0 bg-black">
        {/* Camera preview fills the background */}
        <div className="absolute inset-0" id="video-record" />

        {/* Recording indicator and timer */}
        {isRecording && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 z-10">
            <Circle className="h-3 w-3 fill-current animate-pulse" />
            <span className="font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-10 max-w-xs text-center">
            {error}
          </div>
        )}

        {/* Controls at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-8 safe-area-bottom z-10">
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-16 w-16 rounded-full bg-white/20 text-white hover:bg-white/30"
            onClick={handleClose}
            data-testid="button-close-video"
          >
            <X className="h-8 w-8" />
          </Button>

          {/* Record/Stop button */}
          {!isRecording ? (
            <Button
              size="icon"
              className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white"
              onClick={startRecording}
              data-testid="button-start-recording"
            >
              <Circle className="h-10 w-10 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white"
              onClick={stopRecording}
              data-testid="button-stop-recording"
            >
              <Square className="h-8 w-8 fill-current" />
            </Button>
          )}

          {/* Spacer for symmetry */}
          <div className="h-16 w-16" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
