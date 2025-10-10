# Overview

This is a secure messaging application built as a single-page application (SPA) with a React frontend and Express.js backend. The application features a unique calculator interface that doubles as a secure messaging app, allowing users to communicate privately while maintaining the appearance of a simple calculator. The system includes user authentication, subscription management with freemium model, file uploads with access control, and comprehensive security features.

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
- **User Discovery**: User code system for finding and connecting with other users
- **Message Types**: Support for text, image, video, and voice messages with media URL storage
  - Text messages: Fully functional
  - Image/Video/Voice messages: Schema and rendering complete, requires object storage setup for upload functionality

## Development and Deployment
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Environment Configuration**: Proper environment variable handling for different deployment stages
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages