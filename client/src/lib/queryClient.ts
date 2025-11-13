import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

// Get the API base URL for Capacitor apps
// In local bundle mode, API calls need the full server URL
function getApiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    // Running in Capacitor - use environment variable for server URL
    const serverUrl = import.meta.env.VITE_SERVER_URL || "https://privycalc.com";
    return serverUrl;
  }
  // Running in web browser - use relative paths
  return "";
}

// Helper to construct full URL
// Exported for use in components that need full URLs (e.g., images, videos)
export function getFullUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (baseUrl && !path.startsWith("http")) {
    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }
  return path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON response to extract clean error message
    let errorMessage = text;
    try {
      const errorData = JSON.parse(text);
      // Extract the error message from common response formats
      errorMessage = errorData.error || errorData.message || text;
    } catch (parseError) {
      // If not JSON, use the text as-is
      errorMessage = text || res.statusText;
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // For non-GET requests, try to get CSRF token
  if (method !== "GET") {
    try {
      const csrfUrl = getFullUrl("/api/csrf-token");
      const csrfRes = await fetch(csrfUrl, {
        credentials: "include",
      });
      if (csrfRes.ok) {
        const { csrfToken } = await csrfRes.json();
        headers["x-csrf-token"] = csrfToken;
      }
    } catch (error) {
      // If CSRF token fetch fails, continue without it (for unauthenticated requests)
      console.warn("Failed to fetch CSRF token:", error);
    }
  }

  const fullUrl = getFullUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Check if response has content to parse
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  // For empty responses or non-JSON responses, return null
  return null;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/") as string;
    const fullUrl = getFullUrl(path);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
