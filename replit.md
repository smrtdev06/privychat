# Overview

PrivyCalc is a secure messaging application disguised as a calculator. Built as a single-page application (SPA) with a React frontend and Express.js backend, it offers private communication through a unique calculator interface. Key features include user authentication, a freemium subscription model, secure file uploads with access control, and robust security measures. The project aims to provide a stealthy and secure communication platform with business potential in privacy-focused messaging.

# Recent Changes (October 27, 2025)

- **MAJOR: Switched to LOCAL BUNDLE deployment mode** for both iOS and Android (removed iframe mode)
  - iOS: Local bundle solves iframe blocking issues (cookies, localStorage, blank screens)
  - Android: Local bundle provides better reliability and native plugin integration
  - API calls now use VITE_SERVER_URL environment variable to connect to backend server
  - All native features work seamlessly (in-app purchases, camera, etc.)
- **iOS Safe Area Support**: Added complete safe area inset handling for notched devices (iPhone X and later) - PRODUCTION READY
  - CSS utilities: `.safe-area-top`, `.safe-area-bottom`, `.safe-area-left`, `.safe-area-right`, `.safe-area-all`
  - Applied to ALL page headers: calculator, messaging, conversation, settings, help, about (safe-area-top)
  - Applied to ALL bottom interactive areas: conversation message input, calculator keypad (safe-area-bottom)
  - Sheet component (side menu): Complete safe area support for all variants
    - Left side: safe-area-top, safe-area-bottom, safe-area-left
    - Right side: safe-area-top, safe-area-bottom, safe-area-right
    - Top side: safe-area-top, safe-area-left, safe-area-right
    - Bottom side: safe-area-bottom, safe-area-left, safe-area-right
  - Viewport meta tag includes `viewport-fit=cover` to enable safe area insets
  - Graceful fallback to 0 padding on non-notch devices using `env()` with defaults
  - Works seamlessly on iOS in all orientations (portrait/landscape) and Android/web browsers
- Updated capacitor-bridge to initialize plugins directly (no iframe/postMessage needed)
- Updated queryClient to use full server URLs when running in Capacitor
- Updated documentation to reflect local bundle deployment strategy
- Added Help & Support and About navigation to calculator side menu with functional buttons
- Created public Help & Support page (/help) with FAQs, quick help cards, and contact information
- Created public About page (/about) with app description, key features, and version info
- Implemented smart back navigation (history.back() with fallback to '/') for context preservation
- Added dropdown menus to messaging and conversation pages with Settings, Help & Support, and About options
- Made /help and /about public routes accessible without authentication
- Fixed database schema: made `phone` and `fullName` columns nullable for user registration

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS for accessible, customizable, and responsive design with dark mode.
- **State Management**: TanStack Query for server state with optimistic updates.
- **Routing**: Wouter for lightweight client-side routing.
- **Form Handling**: React Hook Form with Zod for type-safe validation.
- **Mobile Support**: Custom swipe handlers and mobile-first responsive design.

## Backend
- **Framework**: Express.js with TypeScript on Node.js.
- **Database ORM**: Drizzle ORM for type-safe interactions.
- **Authentication**: Passport.js with local strategy (scrypt hashing), Express-session with PostgreSQL store.
- **API Design**: RESTful with standardized error handling.
- **Real-time**: Custom WebSocket server for message delivery with security checks and broadcasting.

## Data Storage
- **Primary Database**: PostgreSQL (Neon serverless).
- **Schema**: Users, Conversations, Messages, Subscription Gifts.
- **Session Storage**: PostgreSQL-backed.
- **File Storage**: Google Cloud Storage with custom ACLs.

## Authentication and Security
- **Authentication**: Session-based with secure password hashing (scrypt).
- **Stealth Mode**: Calculator interface conceals messaging; dual-layer password (standard + numeric PIN).
  - PIN setup with guided instructions and practice modal.
  - Smart hint system for PIN entry.
- **Security**: HTTP-only cookies, CSRF protection, comprehensive input validation (Zod), email-based password reset (secure tokens, 1-hour expiry).
- **Access Control**: Rate limiting (freemium model), object-level permissions for files.
- **Email Verification**: Automatic upon registration, secure tokens, 24-hour expiry, resend option.

## Business Logic
- **Freemium Model**: Free users have daily message limits; premium users get unlimited messages. If one user in a conversation is premium, both send unlimited messages.
- **Subscription Gifts**: Users can gift premium subscriptions via upgrade codes (web-only purchase and redemption to comply with app store policies).
- **Mobile Subscriptions**: Native in-app purchases (Google Play Billing, Apple App Store) with backend receipt validation and webhook support for real-time subscription status updates.
  - **Lifecycle**: Cancel → Keep access → Expire → Downgrade (proper subscription lifecycle with autoRenewing flag)
  - **Promo Codes**: Mobile users can redeem promotional codes from app stores (iOS/Android only)
- **User Discovery**: User code system.
- **Message Types**: Support for text, image, video, and voice messages (schema and rendering complete; object storage needed for full media upload functionality).

## Mobile Deployment (Capacitor)
- **Platform**: Capacitor for iOS and Android (package: `com.newhomepage.privychat`, name: PrivyCalc).
- **Deployment Mode**: **LOCAL BUNDLE** - App runs fully locally with bundled assets for both iOS and Android.
  - Assets bundled: All frontend code (HTML, CSS, JavaScript)
  - API calls: Connect to backend server via VITE_SERVER_URL environment variable
  - Benefits: Works perfectly on iOS (no iframe blocking), reliable native plugin integration
  - Trade-off: Updates require rebuilding the app (consider OTA update solutions like Capgo for faster deployment)
- **API Configuration**: 
  - Web browser: Uses relative paths (e.g., `/api/user`)
  - Capacitor: Uses full server URL from `VITE_SERVER_URL` (e.g., `https://yourapp.replit.dev/api/user`)
  - Auto-detection via `Capacitor.isNativePlatform()` in queryClient
- **Platform Detection**: Use `capacitorBridge.getPlatform()` for consistent platform detection across all contexts
- **WebSocket**: Automatic detection of Capacitor environment and connection to production WebSocket server via VITE_SERVER_URL
- **Loading Screen**: Custom calculator-themed loading indicator during plugin initialization
- **Native Features**: Direct access to Capacitor plugins (in-app purchases, camera, etc.) without postMessage bridge

## Development and Deployment
- **Tooling**: Vite for fast development, TypeScript for type safety, Drizzle Kit for database migrations.
- **Environment**: Robust environment variable handling (`VITE_SERVER_URL`, `REPLIT_DOMAINS`, `SENDGRID_API_KEY`, etc.).
- **Error Handling**: Comprehensive error boundaries.
- **CORS**: Configured for Capacitor mobile apps with `sameSite: "none"` and `secure: true` for cookies.

# External Dependencies

- **Cloud Storage**: Google Cloud Storage
- **Database**: Neon (PostgreSQL serverless)
- **Email Service**: SendGrid
- **Mobile In-App Purchases**: Google Play Billing, Apple App Store
  - Product ID: `premium_yearly` at $29.99/year
  - Backwards compatible subscription (no offers required)
  - **Validation**: Google Play Developer API v3 (googleapis npm package)
    - FAIL-CLOSED: Rejects all purchases when `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` not set (secure)
    - PRODUCTION MODE: Real API validation with service account credentials
    - See GOOGLE_PLAY_API_SETUP.md for complete setup instructions
- **Mobile Purchase Plugin**: `cordova-plugin-inapppurchases` v3.1.1
  - Updated October 2024 from cordova-plugin-purchase v13
  - Works with backwards compatible plans without offers
  - Simpler promise-based API: `getAllProductInfo()`, `purchase()`, `completePurchase()`
  - Billing key configured in: `android/app/src/main/assets/www/manifest.json`