# My Espresso Journal

## Overview

My Espresso Journal is a productivity-focused web application for tracking and rating espresso coffee purchases. Users can record detailed information about their coffee including brand, quantity, roast level, form factor, and comprehensive tasting ratings across multiple dimensions (bitterness, acidity, note clarity, overall taste). The application follows a utility-first design pattern inspired by productivity tools like Linear, Notion, and Airtable, emphasizing efficiency, scannable data, and minimal cognitive load.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod for form validation and type safety

**UI Component System:**
- Shadcn UI component library (New York style variant) built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom CSS variables for theming (light/dark mode support)

**Design System:**
- Typography: Inter font family from Google Fonts
- Spacing: Tailwind's standardized spacing scale (2, 4, 6, 8, 12 units)
- Color system: HSL-based tokens with CSS custom properties for consistency
- Component philosophy: Efficiency-first with minimal clicks, scannable data layout, and clear input affordances

**State Management Strategy:**
- Server state: TanStack Query with infinite stale time and disabled refetch on window focus for data persistence
- Form state: React Hook Form for local form state with schema validation
- UI state: React local state and context for modals, dialogs, and transient UI

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js as the HTTP server framework
- TypeScript with ESM module system for type safety
- Drizzle ORM for database operations and schema management
- Zod for runtime validation and TypeScript type inference

**API Design:**
- RESTful API pattern with resource-based endpoints (`/api/coffees`)
- CRUD operations: GET (list/single), POST (create), PATCH (update), DELETE (remove)
- JSON request/response format with Content-Type headers
- Error handling with appropriate HTTP status codes (400 for validation, 404 for not found, 500 for server errors)

**Storage Layer:**
- In-memory storage implementation (`MemStorage` class) for development/testing
- Designed with storage interface (`IStorage`) for easy swapping to database implementation
- Sorted data retrieval (coffees sorted by order date, newest first)

**Development vs Production:**
- Development: Vite middleware integration with HMR and auto-reloading
- Production: Static file serving from pre-built dist directory
- Environment-specific entry points (`index-dev.ts` vs `index-prod.ts`)

### Database Schema

**Coffees Table Structure:**
- Primary key: UUID auto-generated via PostgreSQL `gen_random_uuid()`
- Text fields: brandName, quantity, notes, roast, formFactor
- Date field: orderDate
- Integer fields: bitternessRating, acidityRating, noteClarityRating, overallTasteRating (1-10 scale)
- Boolean field: worthReordering (stored as integer 0/1)

**ORM Configuration:**
- Drizzle Kit for migrations with PostgreSQL dialect
- Schema-first approach with TypeScript type inference
- Zod integration via drizzle-zod for automatic validation schema generation

### External Dependencies

**Database:**
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Connection managed through `DATABASE_URL` environment variable
- Migration management through Drizzle Kit

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components (accordion, dialog, dropdown, select, slider, etc.)
- Embla Carousel for carousel/slider functionality
- Lucide React for icon system
- CMDK for command palette patterns

**Development Tools:**
- TSX for TypeScript execution in development
- ESBuild for production bundling
- Replit-specific plugins for development banner, error overlay, and cartographer integration

**Form Handling:**
- React Hook Form for performant form state management
- Hookform Resolvers for Zod schema integration
- Zod for schema definition and validation

**Date Handling:**
- date-fns library for date formatting and manipulation

**Styling:**
- Tailwind CSS with PostCSS for processing
- Autoprefixer for CSS compatibility
- Custom configuration with extended color tokens and border radius values