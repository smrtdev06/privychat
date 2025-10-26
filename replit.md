# Overview

PrivyCalc is a secure messaging application disguised as a calculator. Built as a single-page application (SPA) with a React frontend and Express.js backend, it offers private communication through a unique calculator interface. Key features include user authentication, a freemium subscription model, secure file uploads with access control, and robust security measures. The project aims to provide a stealthy and secure communication platform with business potential in privacy-focused messaging.

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
- **Subscription Gifts**: Users can gift premium subscriptions via upgrade codes (web-only to comply with app store policies; code redemption works on all platforms).
- **Mobile Subscriptions**: Native in-app purchases (Google Play Billing, Apple App Store) with backend receipt validation and webhook support for real-time subscription status updates.
  - **Lifecycle**: Cancel → Keep access → Expire → Downgrade (proper subscription lifecycle with autoRenewing flag)
- **User Discovery**: User code system.
- **Message Types**: Support for text, image, video, and voice messages (schema and rendering complete; object storage needed for full media upload functionality).

## Mobile Deployment (Capacitor)
- **Platform**: Capacitor for iOS and Android (package: `com.newhomepage.privychat`, name: PrivyCalc).
- **Deployment Mode**: **HYBRID IFRAME BRIDGE** - Local app loads Capacitor plugins, displays remote Replit server in iframe with postMessage bridge.
  - Alternative: **LOCAL BUNDLE** mode available (recommended for production).
- **Plugin Bridge**: Secure postMessage communication between local Capacitor context and remote app.
  - Strict origin validation (only allowed domains)
  - Secure targetOrigin for postMessage
  - Both direct mode (local) and bridge mode (iframe) supported
  - **IMPORTANT**: Always use `capacitorBridge.getPlatform()` instead of `Capacitor.getPlatform()` to correctly detect platform in iframe mode
- **WebSocket**: Automatic detection of Capacitor environment and connection to production WebSocket server.
- **Loading Screen**: Custom calculator-themed loading indicator prevents blank white screen during initial app load.
- **Security**: Origin allowlist, specific targetOrigin, bidirectional validation (see CAPACITOR_REMOTE_MODE_ANALYSIS.md for details).

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