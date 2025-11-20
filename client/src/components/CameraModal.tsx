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

  useEffect(() => {
    if (!isOpen) return;

    // Start camera when modal opens
    const startCamera = async () => {
      try {
        console.log('🎥 Requesting camera access for mode:', mode);
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available in this browser');
        }

        const constraints = {
          video: { facingMode: 'environment' }, // Rear camera
          audio: mode === 'video' ? true : false,
        };
        
        console.log('🎥 Requesting with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera access granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          mediaStreamRef.current = stream;
        }

        setError(null);
      } catch (err: any) {
        console.error('❌ Failed to start camera:', err.name, err.message);
        let errorMessage = 'Failed to access camera. ';
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage += 'Camera permission denied. Please allow camera access in your device settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage += 'Camera is already in use by another app.';
        } else {
          errorMessage += err.message || 'Please check permissions.';
        }
        
        setError(errorMessage);
      }
    };

    startCamera();

    // Cleanup when modal closes
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
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
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
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
