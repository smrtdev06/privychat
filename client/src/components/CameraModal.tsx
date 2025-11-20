import { useEffect, useRef, useState } from 'react';
import { X, Camera as CameraIcon, Video as VideoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, filename: string, mimeType: string) => void;
  mode: 'photo' | 'video';
}

export function CameraModal({ isOpen, onClose, onCapture, mode }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function to stop all camera tracks
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      console.log('📸 Stopping camera tracks...');
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`📸 Stopped track: ${track.kind}`);
      });
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // Add small delay to ensure previous camera is released
    const timeoutId = setTimeout(() => {
      startCamera();
    }, 100);

    // Start camera when modal opens
    const startCamera = async () => {
      try {
        console.log(`📸 Starting camera for ${mode} mode...`);
        
        // For video mode, try with audio first, fallback to video-only if audio fails
        let stream: MediaStream | null = null;
        
        if (mode === 'video') {
          try {
            // Try to get both video and audio
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
              audio: true,
            });
            console.log('📸 Camera started with audio');
          } catch (audioErr) {
            console.warn('⚠️ Audio not available, using video only:', audioErr);
            // Fallback to video only
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
              audio: false,
            });
            console.log('📸 Camera started without audio');
          }
        } else {
          // Photo mode: video only
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
          console.log('📸 Camera started for photo');
        }

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
        }

        setError(null);
      } catch (err: any) {
        console.error('❌ Failed to start camera:', err);
        setError('Camera access denied. Please allow camera permissions and try again.');
      }
    };

    // Cleanup when modal closes
    return () => {
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [isOpen, mode]);

  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const filename = `photo-${Date.now()}.jpg`;
      onCapture(blob, filename, 'image/jpeg');
      handleClose();
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;

    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const filename = `video-${Date.now()}.webm`;
      onCapture(blob, filename, 'video/webm');
      handleClose();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordedChunks([]);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    console.log('📸 Closing camera modal...');
    stopCamera();
    setIsRecording(false);
    setRecordedChunks([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white text-lg font-semibold">
          {mode === 'photo' ? 'Take Photo' : 'Record Video'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/20"
          data-testid="button-close-camera"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera Preview */}
      <div className="flex-1 relative bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80 flex items-center justify-center">
        {mode === 'photo' ? (
          <Button
            onClick={capturePhoto}
            size="lg"
            className="rounded-full w-20 h-20 bg-white hover:bg-gray-200"
            disabled={!!error}
            data-testid="button-capture-photo"
          >
            <CameraIcon className="h-8 w-8 text-black" />
          </Button>
        ) : (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="lg"
            className={`rounded-full w-20 h-20 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white hover:bg-gray-200'
            }`}
            disabled={!!error}
            data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
          >
            {isRecording ? (
              <div className="w-8 h-8 bg-white rounded-sm" />
            ) : (
              <VideoIcon className="h-8 w-8 text-black" />
            )}
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full">
          Recording...
        </div>
      )}
    </div>
  );
}
