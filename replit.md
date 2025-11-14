# Overview

PrivyCalc is a secure messaging application disguised as a calculator. It offers private communication through a unique calculator interface, built as a single-page application (SPA) with a React frontend and Express.js backend. Key features include user authentication, a freemium subscription model, secure file uploads with access control, and robust security measures. The project aims to provide a stealthy and secure communication platform with significant business potential in privacy-focused messaging.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS for accessible, customizable, and responsive design with dark mode.
- **State Management**: TanStack Query for server state with optimistic updates.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **Mobile Support**: Custom swipe handlers and mobile-first responsive design, including iOS safe area support for notched devices.
- **Public Pages**: Terms & Conditions (/terms) and Privacy Policy (/privacy-policy) pages with professional styling and public access.

## Backend
- **Framework**: Express.js with TypeScript on Node.js.
- **Database ORM**: Drizzle ORM for type-safe interactions.
- **Authentication**: Passport.js with local strategy, Express-session with PostgreSQL store.
- **API Design**: RESTful with standardized error handling.
- **Real-time**: Custom WebSocket server for message delivery with security checks and broadcasting.

## Data Storage
- **Primary Database**: PostgreSQL (Neon serverless).
- **Session Storage**: PostgreSQL-backed.
- **File Storage**: Google Cloud Storage with custom ACLs.

## Authentication and Security
- **Authentication**: Session-based with secure password hashing (scrypt).
- **Registration**: Email-only verification flow (phone verification completely removed as of November 2025).
- **Onboarding Flow**: 
  - First-time users see legal agreement modal (Terms & Privacy Policy)
  - After login, users without PIN are redirected to Settings for PIN setup with app explanation
  - Users with PIN configured go directly to calculator interface
- **Stealth Mode**: Calculator interface conceals messaging, dual-layer password (standard + numeric PIN), PIN setup with guided instructions and smart hints.
- **Security**: HTTP-only cookies, CSRF protection (exempted for mobile upload proxy), comprehensive input validation (Zod), email-based password reset, email verification.
- **Access Control**: Rate limiting (freemium model), conversation-level ACLs for shared media files ensuring both participants can access uploaded images/videos.
- **Account Deletion**: Full account deletion feature (DELETE /api/account) that permanently removes all user data including messages, conversations, subscriptions, and gifts. Accessible via Settings page with confirmation dialog. Required by App Store guidelines.

## Business Logic
- **Freemium Model**: Free users have daily message limits; premium users get unlimited messages. If one user in a conversation is premium, both send unlimited messages.
- **Subscription Gifts**: Users can gift premium subscriptions via upgrade codes (web-only purchase and redemption).
- **Mobile Subscriptions**: Native in-app purchases (Google Play Billing, Apple App Store) with backend receipt validation and webhook support for real-time subscription status updates (DID_RENEW, EXPIRED, REFUND, DID_CHANGE_RENEWAL_STATUS). Promo codes are supported.
- **User Discovery**: User code system.
- **Message Types**: Support for text, image, video, and voice messages.

## Media Streaming
- **Video/Audio/Image Delivery**: Backend streaming endpoint (`GET /api/objects/stream`) with ACL validation
- **Range Request Support**: RFC 7233 compliant for video seeking (Safari/iOS compatible)
  - Suffix byte-ranges (bytes=-N)
  - Absolute ranges (bytes=start-end, bytes=start-)
  - Multi-range handling (falls back to full file)
- **Caching**: ETag and Last-Modified headers with If-None-Match/If-Range support
- **Security**: Session authentication + conversation-level ACL validation before streaming

## Mobile Deployment (Capacitor)
- **Platform**: Capacitor for iOS and Android (`com.newhomepage.privychat`, name: PrivyCalc).
- **Deployment Mode**: **LOCAL BUNDLE** - The app runs fully locally with bundled assets for both iOS and Android, connecting to the backend via `VITE_SERVER_URL`.
- **API Configuration**: Uses full server URL from `VITE_SERVER_URL` for Capacitor, relative paths for web, with auto-detection via `Capacitor.isNativePlatform()`.
- **Platform Detection**: Uses `capacitorBridge.getPlatform()` for consistent platform detection.
- **WebSocket**: Automatic detection of Capacitor environment and connection to production WebSocket server via `VITE_SERVER_URL`.
- **Native Features**: Direct access to Capacitor plugins (e.g., in-app purchases, camera).
- **iOS Cookie Fix**: Configured `WKAppBoundDomains` in `Info.plist` to enable session cookies.
- **Deep Linking**: Native URL schemes (`privycalc://`) configured for iOS and Android for promo code redemption.
- **Legal Persistence**: Mobile legal modal persists user acceptance using Capacitor's Preferences API.
- **File Uploads**: 
  - **Web**: Direct uploads to Google Cloud Storage via signed URLs (fast, no proxy overhead)
  - **Mobile**: Backend proxy upload (`/api/objects/upload-proxy`) to bypass CORS restrictions in WebView
  - ObjectUploader component auto-detects platform and uses appropriate strategy (XHRUpload for mobile, AwsS3 for web)

## Development and Deployment
- **Tooling**: Vite, TypeScript, Drizzle Kit for database migrations.
- **Environment**: Robust environment variable handling.
- **Error Handling**: Comprehensive error boundaries.
- **CORS**: Configured for Capacitor mobile apps with `sameSite: "none"` and `secure: true` for cookies.

# External Dependencies

- **Cloud Storage**: Google Cloud Storage
- **Database**: Neon (PostgreSQL serverless)
- **Email Service**: SendGrid
- **Mobile In-App Purchases**: Google Play Billing, Apple App Store
  - Product ID: `premium_yearly` ($29.99/year)
  - **Validation**: Google Play Developer API v3 (googleapis npm package)
- **Mobile Purchase Plugin**: `cordova-plugin-inapppurchases` v3.1.1