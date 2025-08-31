# IIMB Samarpan - Social Impact Platform

## Overview

IIMB Samarpan is a comprehensive social impact platform designed for IIM Bangalore students to discover, apply for, and participate in meaningful social work opportunities. The platform gamifies social engagement through a coin-based reward system and leaderboards, encouraging students to contribute to community service while tracking their impact. It features opportunity management, application tracking, user profiles with achievements, and administrative tools for managing the platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with structured error handling
- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Custom logging, JSON parsing, and error handling

### Authentication & Authorization
- **Provider**: Replit OpenID Connect (OIDC) integration
- **Strategy**: Passport.js with custom OIDC strategy
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Security**: HTTP-only cookies with secure flags and session expiration

### Data Storage & ORM
- **Database**: PostgreSQL for relational data storage
- **ORM**: Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Comprehensive schema covering users, opportunities, applications, badges, and sessions
- **Migrations**: Drizzle Kit for database schema management

### Key Features & Modules

#### User Management
- Profile management with customizable privacy settings
- Coin-based reward system for completed activities
- Badge achievements for milestones and accomplishments
- Leaderboard with anonymization options

#### Opportunity System
- CRUD operations for social impact opportunities
- Advanced filtering by type, duration, skills, and status
- Image management with fallback defaults
- Application tracking and status management

#### Gamification
- Coin rewards for participation and completion
- Badge system for achievements
- Public leaderboards with privacy controls
- Progress tracking and statistics

#### Administrative Tools
- Admin dashboard with analytics and KPIs
- Opportunity management interface
- Application review and status updates
- User management and platform oversight

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OIDC provider
- **Image Assets**: Unsplash for default opportunity images
- **Fonts**: Google Fonts (Poppins family)
- **Icons**: Font Awesome for UI icons
- **Development Tools**: Replit development environment with live reload

### Architectural Decisions

#### Monorepo Structure
- Shared types and schemas between client and server
- Unified TypeScript configuration
- Common utilities and validation logic

#### Type Safety
- End-to-end TypeScript for compile-time error prevention
- Zod schemas for runtime validation
- Drizzle ORM for database type safety

#### Performance Optimizations
- TanStack Query for efficient data fetching and caching
- Vite for fast development builds
- Connection pooling for database efficiency
- Optimized image loading with fallbacks

#### User Experience
- Responsive design for mobile and desktop
- Toast notifications for user feedback
- Loading states and error handling
- Intuitive navigation and filtering