import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';
import { getFullUrl } from '@/lib/queryClient';

/**
 * Hook to get proper media URLs that work on iOS
 * 
 * Problem: iOS WebView doesn't send cookies with <img> and <video> src attributes
 * Solution: For iOS, fetch media with CapacitorHttp (which sends cookies) and create blob URLs
 */
export function useMediaUrl(mediaPath: string | undefined, messageType: 'image' | 'video' | 'voice') {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!mediaPath) {
      setLoading(false);
      return;
    }

    // For non-iOS platforms, use direct streaming URL
    if (!isIOS) {
      const streamUrl = `${getFullUrl("")}/api/objects/stream?path=${encodeURIComponent(mediaPath)}`;
      setBlobUrl(streamUrl);
      setLoading(false);
      return;
    }

    // For iOS: Fetch with CapacitorHttp and create blob URL
    const fetchMediaForIOS = async () => {
      try {
        setLoading(true);
        setError(false);

        const streamUrl = `${getFullUrl("")}/api/objects/stream?path=${encodeURIComponent(mediaPath)}`;
        
        console.log(`📱 [iOS] Fetching media with credentials: ${streamUrl}`);

        // Use fetch with credentials instead of CapacitorHttp for media
        const response = await fetch(streamUrl, {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          console.error(`❌ [iOS] Failed to fetch media: ${response.status}`);
          setError(true);
          setLoading(false);
          return;
        }

        // Create blob from response
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        console.log(`✅ [iOS] Created blob URL for ${messageType}, size: ${blob.size} bytes`);
        setBlobUrl(url);
        setLoading(false);
      } catch (err) {
        console.error(`❌ [iOS] Error fetching media:`, err);
        setError(true);
        setLoading(false);
      }
    };

    fetchMediaForIOS();

    // Cleanup blob URL when component unmounts
    return () => {
      if (blobUrl && isIOS) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [mediaPath, isIOS]);

  return { url: blobUrl, loading, error };
}
