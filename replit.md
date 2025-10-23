# Overview

**PrivyCalc** is a secure messaging application built as a single-page application (SPA) with a React frontend and Express.js backend. The application features a unique calculator interface that doubles as a secure messaging app, allowing users to communicate privately while maintaining the appearance of a simple calculator. The system includes user authentication, subscription management with freemium model, file uploads with access control, and comprehensive security features.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Mobile Support**: Custom swipe handlers and responsive design optimized for mobile-first experience

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express-session with PostgreSQL session store for persistent sessions
- **File Uploads**: Uppy integration with Google Cloud Storage for scalable file handling
- **API Design**: RESTful API with standardized error handling and request/response patterns

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless for scalable cloud hosting
- **Database Schema**: Four main entities with proper relationships:
  - Users (authentication, subscription, rate limiting)
  - Conversations (two-party messaging)
  - Messages (content, media, read status)
  - Subscription Gifts (premium upgrade system)
- **Session Storage**: PostgreSQL-backed session store for security and persistence
- **File Storage**: Google Cloud Storage with custom ACL policies for access control

## Authentication and Authorization
- **User Authentication**: Session-based authentication with secure password hashing
- **Session Security**: HTTP-only cookies with secure settings and CSRF protection
- **Rate Limiting**: Daily message limits for free users with subscription-based upgrades
- **Access Control**: Object-level permissions for file access with custom ACL policies
- **Phone Verification**: SMS verification system for account security (component structure prepared)

## Security Features
- **Password Security**: Dual-layer password system (standard + numeric for calculator mode)
  - **PIN Setup with Instructions**: New users see step-by-step guide explaining how to unlock messaging (type PIN on calculator, press =)
  - **Practice Modal**: Success modal after PIN setup offers optional practice session to reinforce learning
  - **Smart Hint System**: Tracks when users type correct PIN 3 times without pressing =, shows helpful toast reminder
- **Password Recovery**: Email-based password reset system
  - Database fields: passwordResetToken, passwordResetExpiry (1-hour expiration)
  - Security: Tokens are cryptographically secure (32-byte random), one-time use, privacy-preserving (doesn't reveal account existence)
  - Frontend: "Forgot Password?" dialog on login page, dedicated /reset-password page
  - Backend: `/api/password/request-reset` and `/api/password/reset` endpoints with SendGrid email notifications
- **Stealth Mode**: Calculator interface disguises the messaging functionality
- **File Security**: Object storage with granular access control and metadata-based permissions
- **Session Management**: Secure session handling with proper expiration and cleanup
- **Input Validation**: Comprehensive validation using Zod schemas on both frontend and backend

## Business Logic
- **Freemium Model**: Free users limited to 1 message per day, premium users get unlimited messaging
  - **Shared Premium Benefit**: If EITHER user in a conversation has premium, BOTH users can send unlimited messages
  - Implementation: `canUserSendMessage()` checks both sender and receiver subscription status
  - Daily message limits only apply when BOTH users are on free tier
- **Subscription Gifts**: Users can purchase and gift premium subscriptions via upgrade codes
- **Mobile Subscriptions**: Native in-app purchases for iOS and Android
  - Direct integration with Google Play Billing and Apple App Store
  - Backend receipt validation for both platforms
  - Automatic subscription sync and renewal handling
  - Webhook support for real-time subscription updates
- **User Discovery**: User code system for finding and connecting with other users
- **Message Types**: Support for text, image, video, and voice messages with media URL storage
  - Text messages: Fully functional
  - Image/Video/Voice messages: Schema and rendering complete, requires object storage setup for upload functionality

## Real-Time Messaging
- **WebSocket Server**: Custom WebSocket implementation for real-time message delivery
  - Path: `/ws` with query parameters `userId` and `conversationId`
  - Security: Verifies user exists and is a conversation member before allowing connection
  - Broadcasts messages to all authorized clients in a conversation
- **WebSocket Client**: Custom `useWebSocket` hook with automatic reconnection
  - Detects Capacitor mobile environment and uses appropriate server URL
  - Memory leak prevention: stops reconnections after component unmount via `isActiveRef`
  - Falls back to polling in environments where WebSocket isn't available

## Mobile Deployment (Capacitor)
- **Platform**: Capacitor for iOS and Android native apps
- **Package Name**: `com.newhomepage.privychat`
- **App Name**: PrivyCalc
- **Deployment Mode**: **REMOTE MODE** - App loads from published Replit server instead of bundled files
  - ✅ Publish mobile app **ONCE** to app stores
  - ✅ All frontend updates automatic (no app store review)
  - ✅ Users get updates instantly by publishing to Replit
  - ✅ No rebuilding for frontend changes
- **Configuration**:
  - Set published URL: `export VITE_PUBLISHED_URL=yourapp.replit.app`
  - Or edit `capacitor.config.ts` to replace `YOUR_PUBLISHED_URL.replit.app`
  - Sync only (no build): `npx cap sync android` or `npx cap sync ios`
- **WebSocket Compatibility**: Automatically detects Capacitor environment and connects to production server
  - Protocol mapping: `http://` → `ws://`, `https://` → `wss://`
  - Uses published URL for both HTTP and WebSocket connections
- **Update Workflow**:
  - Frontend changes: Just publish to Replit → Users updated instantly
  - Native changes (plugins, permissions): Sync and resubmit to app stores
- **Complete Guides**: 
  - `CAPACITOR_BUILD_GUIDE.md` - Detailed build and publish instructions
  - `REMOTE_MODE_GUIDE.md` - Remote mode setup and workflow

## Email Integration (SendGrid)
- **Email Service**: SendGrid for transactional email delivery
- **Configuration**: Environment variables `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`
- **Email Module**: `server/email.ts` provides `sendEmail()` function for sending emails
- **Test Endpoints**: 
  - GET `/api/sendgrid/test` - Verify SendGrid configuration
  - POST `/api/sendgrid/send-test` - Send test email (admin only)
- **Use Cases**: Password resets, verification emails, notifications, premium upgrade confirmations

## Mobile In-App Subscriptions
- **Platform Support**: Direct integration with Google Play Billing (Android) and Apple App Store (iOS)
- **Purchase Plugin**: Uses `cordova-plugin-purchase` for cross-platform in-app purchase support
- **Database Schema**: `mobileSubscriptions` table tracks all mobile subscription purchases
  - Platform identifier (ios/android)
  - Product ID (subscription SKU)
  - Purchase tokens (Android) and transaction IDs (iOS)
  - Receipt data and expiry dates
  - Auto-renewal status
- **Backend Validation**:
  - POST `/api/mobile-subscription/validate-android` - Validates Google Play purchases
  - POST `/api/mobile-subscription/validate-ios` - Validates App Store receipts
  - GET `/api/mobile-subscription/status` - Gets user's active subscription
- **Webhook Handlers**:
  - POST `/api/mobile-subscription/webhook/google` - Google Play Real-time Developer Notifications
  - POST `/api/mobile-subscription/webhook/apple` - Apple App Store Server Notifications
- **Frontend Component**: `MobileSubscription` component in Settings page
  - Platform detection using Capacitor
  - Displays available subscription products
  - Handles purchase flow and backend validation
  - Automatically updates user subscription status
- **Setup Requirements**:
  - **Google Play**: Service account JSON key, Google Play Developer API enabled
  - **Apple App Store**: App Store Connect API key, shared secret for receipt validation
  - Configure product IDs in both app stores (e.g., "premium_monthly", "premium_yearly")
- **Subscription Sync**: `syncUserSubscriptionStatus()` automatically updates user's premium status based on active mobile subscription

## Promo Code Redemption
- **Platform Support**: Google Play promo codes (Android) and Apple App Store offer codes (iOS)
- **Code Types**:
  - **Google Play**: One-time codes (10,000/quarter) and custom codes (up to 99,999 redemptions)
  - **Apple**: One-time codes (100/product) and custom codes (up to 25,000 redemptions)
- **Deep Link Support**: Custom URL scheme `stealthchat://redeem?code=PROMOCODE`
  - Automatic app opening and code pre-population
  - Seamless redemption from email, SMS, social media
- **Database Schema**: `promoCodeRedemptions` table tracks redemption attempts
  - User ID, platform, promo code value
  - Status (pending, success, failed)
  - Error messages for debugging
  - Link to created subscription if successful
- **Backend APIs**:
  - POST `/api/promo-code/log-redemption` - Log redemption attempt
  - GET `/api/promo-code/history` - Get user's redemption history
  - POST `/api/promo-code/generate-url` - Generate platform-specific redemption URL
- **Frontend Component**: `PromoCodeRedeem` in Settings page
  - Platform detection and appropriate redemption flow
  - Auto-population from deep links
  - Redemption history display (last 3 attempts)
  - Input validation and error handling
- **Redemption Flows**:
  - **Android**: Opens Google Play Store redemption page or in-app dialog
  - **iOS**: Presents native StoreKit redemption sheet (iOS 14+) or web URL fallback
- **Complete Guide**: See `PROMO_CODE_GUIDE.md` for setup, testing, and distribution strategies

## Email Verification System
- **Automatic Verification Emails**: Sent automatically upon user registration
- **Email Verification Flow**:
  1. User registers → System generates unique 32-byte hex token
  2. Token saved to database with 24-hour expiration
  3. Verification email sent with clickable link
  4. User clicks link → Redirected to `/verify-email?token=...`
  5. System verifies token validity and expiration
  6. Email marked as verified → Welcome email sent
- **Database Fields**:
  - `isEmailVerified`: Boolean flag for verification status
  - `emailVerificationToken`: Unique verification token
  - `emailVerificationExpiry`: Token expiration timestamp (24 hours)
- **API Endpoints**:
  - POST `/api/email/send-verification` - Send verification email (authenticated)
  - POST `/api/email/verify` - Verify email with token (public)
  - POST `/api/email/resend-verification` - Resend verification email (authenticated)
- **Email Templates**:
  - Verification email: Professional HTML template with clickable button
  - Welcome email: Sent after successful verification with app features guide
- **UI Components**:
  - `EmailVerificationBanner`: Shows reminder banner on Settings page if not verified
  - `/verify-email` page: Handles token verification with visual feedback
- **Security**:
  - Cryptographically secure tokens (32-byte random)
  - Automatic token expiration (24 hours)
  - One-time use tokens (cleared after verification)
- **User Experience**:
  - Non-blocking: Registration succeeds even if email fails
  - Resend option: Users can request new verification email
  - Visual indicators: Banner shows verification status
  - Auto-redirect: After verification, auto-redirects to login

## Development and Deployment
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Environment Configuration**: Proper environment variable handling for different deployment stages
  - `VITE_SERVER_URL`: Server URL for Capacitor mobile apps (optional, falls back to REPLIT_DOMAINS)
  - `REPLIT_DOMAINS`: Automatically available in Replit, used for WebSocket and API connections in mobile
  - `SENDGRID_API_KEY`: SendGrid API key for email functionality
  - `SENDGRID_FROM_EMAIL`: Verified sender email address for SendGrid
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages