import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';

export interface CapturedMedia {
  blob: Blob;
  filename: string;
  mimeType: string;
}

/**
 * Hook for capturing photos and videos using Capacitor's native Camera API
 * This bypasses WebView restrictions and uses native camera permissions
 */
export function useNativeCamera() {
  const isNative = Capacitor.isNativePlatform();

  /**
   * Request camera permissions before use
   * This is critical for Android to work properly
   */
  const requestPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      console.log('📸 Current camera permissions:', permissions);
      
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        console.log('📸 Requesting camera permissions...');
        const result = await Camera.requestPermissions();
        console.log('📸 Permission request result:', result);
        
        if (result.camera !== 'granted' || result.photos !== 'granted') {
          throw new Error('Camera permissions denied');
        }
      }
    } catch (error: any) {
      console.error('Failed to request camera permissions:', error);
      throw new Error('Camera permissions are required');
    }
  };

  /**
   * Capture a photo using HTML5 file input with camera access
   * More reliable than Capacitor Camera API on some Android devices
   */
  const capturePhoto = async (): Promise<CapturedMedia> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a hidden file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Accept images
        input.capture = 'environment'; // Use camera (not gallery)
        input.style.display = 'none';
        document.body.appendChild(input);

        // Handle file selection
        input.onchange = async (event: Event) => {
          try {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            
            // Cleanup
            document.body.removeChild(input);

            if (!file) {
              reject(new Error('No photo captured'));
              return;
            }

            console.log('📸 Photo captured:', file.name, file.size, 'bytes');

            // Ensure it's an image file
            if (!file.type.startsWith('image/')) {
              reject(new Error('Selected file is not an image'));
              return;
            }

            // Determine extension from filename or MIME type
            let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
              extension = file.type.split('/')[1] || 'jpg';
            }

            resolve({
              blob: file,
              filename: `photo-${Date.now()}.${extension}`,
              mimeType: file.type,
            });
          } catch (error: any) {
            document.body.removeChild(input);
            reject(error);
          }
        };

        // Handle cancellation
        input.oncancel = () => {
          document.body.removeChild(input);
          reject(new Error('Photo capture cancelled'));
        };

        // Trigger camera
        input.click();
      } catch (error: any) {
        console.error('Failed to capture photo:', error);
        reject(new Error(error.message || 'Failed to capture photo'));
      }
    });
  };

  /**
   * Select a photo from the gallery using HTML5 file input
   * More reliable than Capacitor Camera API
   */
  const selectPhoto = async (): Promise<CapturedMedia> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a hidden file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Only show images in file picker
        input.style.display = 'none';
        document.body.appendChild(input);

        // Handle file selection
        input.onchange = async (event: Event) => {
          try {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            
            // Cleanup
            document.body.removeChild(input);

            if (!file) {
              reject(new Error('No photo selected'));
              return;
            }

            console.log('🖼️ Photo selected from gallery:', file.name, file.size, 'bytes');

            // Ensure it's an image file
            if (!file.type.startsWith('image/')) {
              reject(new Error('Selected file is not an image'));
              return;
            }

            // Determine extension from filename or MIME type
            let extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
              extension = file.type.split('/')[1] || 'jpg';
            }

            resolve({
              blob: file,
              filename: `photo-${Date.now()}.${extension}`,
              mimeType: file.type,
            });
          } catch (error: any) {
            document.body.removeChild(input);
            reject(error);
          }
        };

        // Handle cancellation
        input.oncancel = () => {
          document.body.removeChild(input);
          reject(new Error('Photo selection cancelled'));
        };

        // Trigger file picker
        input.click();
      } catch (error: any) {
        console.error('Failed to select photo:', error);
        reject(new Error(error.message || 'Failed to select photo'));
      }
    });
  };

  /**
   * Select a video from the gallery using HTML5 file input
   * This is more reliable than Camera API's non-standard captureMode
   */
  const selectVideo = async (): Promise<CapturedMedia> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a hidden file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*'; // Only show videos in file picker
        input.style.display = 'none';
        document.body.appendChild(input);

        // Handle file selection
        input.onchange = async (event: Event) => {
          try {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            
            // Cleanup
            document.body.removeChild(input);

            if (!file) {
              reject(new Error('No video selected'));
              return;
            }

            console.log('🎬 Video selected from gallery:', file.name, file.size, 'bytes');

            // Ensure it's a video file
            if (!file.type.startsWith('video/')) {
              reject(new Error('Selected file is not a video'));
              return;
            }

            // Determine extension from filename or MIME type
            let extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            if (!['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(extension)) {
              // Fallback to extension from MIME type
              extension = file.type.split('/')[1] || 'mp4';
            }

            resolve({
              blob: file,
              filename: `video-${Date.now()}.${extension}`,
              mimeType: file.type,
            });
          } catch (error: any) {
            document.body.removeChild(input);
            reject(error);
          }
        };

        // Handle cancellation
        input.oncancel = () => {
          document.body.removeChild(input);
          reject(new Error('Video selection cancelled'));
        };

        // Trigger file picker
        input.click();
      } catch (error: any) {
        console.error('Failed to select video:', error);
        reject(new Error(error.message || 'Failed to select video'));
      }
    });
  };

  /**
   * Record a video using Capacitor Camera API with VIDEO mode
   * This launches native iOS/Android camera app for video recording
   * Much more reliable than VideoRecorder plugin
   */
  const captureVideo = async (): Promise<CapturedMedia> => {
    if (!isNative) {
      throw new Error('Video recording is only available on native platforms');
    }

    try {
      console.log('🎥 Starting native video recording with Camera API...');

      // Request permissions first
      const permissions = await Camera.checkPermissions();
      console.log('📸 Current permissions:', permissions);
      
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        console.log('📸 Requesting camera permissions...');
        const result = await Camera.requestPermissions();
        console.log('📸 Permission result:', result);
        
        if (result.camera !== 'granted' || result.photos !== 'granted') {
          throw new Error('Camera permissions denied. Please enable camera access in Settings.');
        }
      }

      // Use Camera API with VIDEO mode to launch native camera app for recording
      const video = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        // @ts-ignore - VIDEO mode exists but might not be in types
        captureMode: 'VIDEO',
        quality: 90,
      });

      console.log('✅ Video captured:', video);

      if (!video.path) {
        throw new Error('No video path returned from camera');
      }

      // Read the video file using Filesystem API
      const videoPath = video.path.replace('file://', '');
      console.log('📂 Reading video from path:', videoPath);

      const videoFile = await Filesystem.readFile({
        path: videoPath
      });

      console.log('📂 Video file read, data type:', typeof videoFile.data);

      // Convert base64 to Blob
      const base64Data = typeof videoFile.data === 'string' ? videoFile.data : '';
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // iOS typically produces .mov or .mp4, Android produces .mp4
      const mimeType = video.format === 'mov' ? 'video/quicktime' : 'video/mp4';
      const extension = video.format || 'mp4';
      
      const blob = new Blob([bytes], { type: mimeType });
      const filename = `video-${Date.now()}.${extension}`;

      console.log('✅ Video converted to blob:', filename, blob.size, 'bytes', mimeType);

      return {
        blob,
        filename,
        mimeType,
      };
    } catch (error: any) {
      console.error('❌ Failed to capture video:', error);
      throw new Error(error.message || 'Failed to record video. Make sure you are testing on a real device.');
    }
  };

  return {
    isNative,
    capturePhoto,
    selectPhoto,
    captureVideo,
    selectVideo,
  };
}
