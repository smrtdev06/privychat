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
   * Capture a photo using the native camera
   */
  const capturePhoto = async (): Promise<CapturedMedia> => {
    try {
      // Request permissions first
      await requestPermissions();
      
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl, // Use DataUrl instead of Uri for better Android compatibility
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: false,
      });

      if (!photo.dataUrl) {
        throw new Error('No photo captured');
      }

      // Convert base64 data URL to blob
      const base64Data = photo.dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${photo.format || 'jpeg'}` });

      return {
        blob,
        filename: `photo-${Date.now()}.${photo.format || 'jpg'}`,
        mimeType: `image/${photo.format || 'jpeg'}`,
      };
    } catch (error: any) {
      console.error('Failed to capture photo:', error);
      throw new Error(error.message || 'Failed to capture photo');
    }
  };

  /**
   * Select a photo from the gallery
   */
  const selectPhoto = async (): Promise<CapturedMedia> => {
    try {
      // Request permissions first
      await requestPermissions();
      
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl, // Use DataUrl instead of Uri for better Android compatibility
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false,
      });

      if (!photo.dataUrl) {
        throw new Error('No photo selected');
      }

      // Convert base64 data URL to blob
      const base64Data = photo.dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${photo.format || 'jpeg'}` });

      return {
        blob,
        filename: `photo-${Date.now()}.${photo.format || 'jpg'}`,
        mimeType: `image/${photo.format || 'jpeg'}`,
      };
    } catch (error: any) {
      console.error('Failed to select photo:', error);
      throw new Error(error.message || 'Failed to select photo');
    }
  };

  /**
   * Select a video from the gallery
   */
  const selectVideo = async (): Promise<CapturedMedia> => {
    try {
      // Request permissions first
      await requestPermissions();
      
      // Use Camera API in VIDEO mode with Photos source
      // @ts-ignore - captureMode is not in types but works on native
      const result = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false,
        captureMode: 'VIDEO', // Enable video selection mode
      });

      console.log('🎬 Video selection result:', {
        path: result.path,
        webPath: result.webPath,
        format: result.format,
      });

      let blob: Blob;
      let extension: string;

      // Try to read from native path first (iOS/Android with path support)
      if (result.path) {
        try {
          // Strip file:// scheme if present
          const normalizedPath = result.path.replace(/^file:\/\//, '');
          
          console.log('🎬 Reading video file from:', normalizedPath);
          
          // Read the actual video file using Filesystem API
          const videoData = await Filesystem.readFile({
            path: normalizedPath,
          });

          // Convert base64 to blob
          const base64Data = typeof videoData.data === 'string' 
            ? videoData.data 
            : videoData.data.toString();
          
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          // Determine extension from file path
          extension = result.path.split('.').pop()?.toLowerCase() || 'mp4';
          const mimeType = extension === 'mov' ? 'video/quicktime' : `video/${extension}`;
          
          blob = new Blob([byteArray], { type: mimeType });
          
          console.log('✅ Video read successfully via Filesystem:', blob.size, 'bytes');
        } catch (fsError: any) {
          console.warn('⚠️ Filesystem read failed, falling back to webPath:', fsError.message);
          
          // Fallback to webPath if Filesystem fails
          if (!result.webPath) {
            throw new Error('No video file available (both path and webPath failed)');
          }
          
          const response = await fetch(result.webPath);
          blob = await response.blob();
          extension = result.format || 'mp4';
          
          console.log('✅ Video read successfully via webPath:', blob.size, 'bytes');
        }
      } else if (result.webPath) {
        // Android fallback: use webPath directly if path is not available
        console.log('🎬 Using webPath (Android fallback)');
        const response = await fetch(result.webPath);
        blob = await response.blob();
        extension = result.format || 'mp4';
        
        console.log('✅ Video read successfully via webPath:', blob.size, 'bytes');
      } else {
        throw new Error('No video file path returned');
      }

      const mimeType = extension === 'mov' ? 'video/quicktime' : `video/${extension}`;

      return {
        blob,
        filename: `video-${Date.now()}.${extension}`,
        mimeType,
      };
    } catch (error: any) {
      console.error('Failed to select video:', error);
      throw new Error(error.message || 'Failed to select video');
    }
  };

  /**
   * Record a video using the native camera
   * Note: Requires microphone permissions in addition to camera
   */
  const captureVideo = async (): Promise<CapturedMedia> => {
    try {
      // Request permissions first
      await requestPermissions();
      
      // Use Camera API in VIDEO mode
      // @ts-ignore - captureMode is not in types but works on native
      const result = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: false,
        presentationStyle: 'fullscreen',
        captureMode: 'VIDEO', // Enable video recording mode
      });

      console.log('📹 Video capture result:', {
        path: result.path,
        webPath: result.webPath,
        format: result.format,
      });

      let blob: Blob;
      let extension: string;

      // Try to read from native path first (iOS/Android with path support)
      if (result.path) {
        try {
          // Strip file:// scheme if present
          const normalizedPath = result.path.replace(/^file:\/\//, '');
          
          console.log('📹 Reading video file from:', normalizedPath);
          
          // Read the actual video file using Filesystem API
          const videoData = await Filesystem.readFile({
            path: normalizedPath,
          });

          // Convert base64 to blob
          const base64Data = typeof videoData.data === 'string' 
            ? videoData.data 
            : videoData.data.toString();
          
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          // Determine extension from file path
          extension = result.path.split('.').pop()?.toLowerCase() || 'mp4';
          const mimeType = extension === 'mov' ? 'video/quicktime' : `video/${extension}`;
          
          blob = new Blob([byteArray], { type: mimeType });
          
          console.log('✅ Video read successfully via Filesystem:', blob.size, 'bytes');
        } catch (fsError: any) {
          console.warn('⚠️ Filesystem read failed, falling back to webPath:', fsError.message);
          
          // Fallback to webPath if Filesystem fails
          if (!result.webPath) {
            throw new Error('No video file available (both path and webPath failed)');
          }
          
          const response = await fetch(result.webPath);
          blob = await response.blob();
          extension = result.format || 'mp4';
          
          console.log('✅ Video read successfully via webPath:', blob.size, 'bytes');
        }
      } else if (result.webPath) {
        // Android fallback: use webPath directly if path is not available
        console.log('📹 Using webPath (Android fallback)');
        const response = await fetch(result.webPath);
        blob = await response.blob();
        extension = result.format || 'mp4';
        
        console.log('✅ Video read successfully via webPath:', blob.size, 'bytes');
      } else {
        throw new Error('No video file path returned');
      }

      const mimeType = extension === 'mov' ? 'video/quicktime' : `video/${extension}`;

      return {
        blob,
        filename: `video-${Date.now()}.${extension}`,
        mimeType,
      };
    } catch (error: any) {
      console.error('Failed to capture video:', error);
      throw new Error(error.message || 'Failed to capture video');
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
