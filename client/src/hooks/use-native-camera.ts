import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

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
   * Capture a photo using the native camera
   */
  const capturePhoto = async (): Promise<CapturedMedia> => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: false,
      });

      if (!photo.webPath) {
        throw new Error('No photo captured');
      }

      // Fetch the photo as a blob
      const response = await fetch(photo.webPath);
      const blob = await response.blob();

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
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        allowEditing: false,
      });

      if (!photo.webPath) {
        throw new Error('No photo selected');
      }

      // Fetch the photo as a blob
      const response = await fetch(photo.webPath);
      const blob = await response.blob();

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
   * Record a video using the native camera
   * Note: Requires microphone permissions in addition to camera
   */
  const captureVideo = async (): Promise<CapturedMedia> => {
    try {
      // @ts-ignore - captureMode is not in types but works on native
      const video = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false,
        saveToGallery: false,
        presentationStyle: 'fullscreen',
        captureMode: 'VIDEO', // Enable video recording mode
      });

      if (!video.webPath) {
        throw new Error('No video captured');
      }

      // Fetch the video as a blob
      const response = await fetch(video.webPath);
      const blob = await response.blob();

      return {
        blob,
        filename: `video-${Date.now()}.${video.format || 'mp4'}`,
        mimeType: `video/${video.format || 'mp4'}`,
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
  };
}
