# Firestore Migration Summary

This document outlines the changes made to migrate the Coffee Journal app from in-memory storage to Google Cloud Firestore.

## Changes Made

### 1. Dependencies Updated (`package.json`)
- **Added**: `firebase-admin` - Firebase Admin SDK for server-side Firestore operations
- **Removed**: 
  - `drizzle-orm` - ORM for PostgreSQL (not needed for Firestore)
  - `drizzle-zod` - Zod schema generator for Drizzle (not needed)
  - `drizzle-kit` - Drizzle migration tool (not needed)
  - `@neondatabase/serverless` - Neon PostgreSQL client (not needed)
  - `@types/connect-pg-simple` - TypeScript types for PostgreSQL session store (not needed)
  - `@types/passport` and `@types/passport-local` - Passport auth types (kept Express but removed auth package references)

### 2. New Storage Implementation

#### File: `server/firestore-storage.ts` (NEW)
- Implements `IStorage` interface for Firestore
- `FirestoreStorage` class handles all database operations:
  - `getCoffees()` - Fetch all coffees, ordered by date (newest first)
  - `getCoffee(id)` - Fetch single coffee by ID
  - `createCoffee(data)` - Create new coffee entry
  - `updateCoffee(id, data)` - Update existing coffee
  - `deleteCoffee(id)` - Delete coffee entry
- Handles Firestore-specific data conversions:
  - `Timestamp` objects for dates
  - Document ID as separate field
  - Automatic `createdAt` timestamps

### 3. Storage Initialization

#### File: `server/storage.ts` (UPDATED)
- Still maintains `MemStorage` for in-memory storage (used in development by default)
- Now exports `FirestoreStorage` instance for production
- **Selection Logic**:
  - Production (`NODE_ENV=production`): Uses `FirestoreStorage`
  - Development: Uses `MemStorage` (in-memory)
  - Override: Set `USE_FIRESTORE=true` to use Firestore in development

### 4. Firebase Initialization

#### File: `server/firebase.ts` (NEW)
- Initializes Firebase Admin SDK
- Two authentication modes:
  - **GCP Hosted**: Uses Application Default Credentials (automatic on Cloud Run, App Engine, etc.)
  - **Local Development**: Uses service account key via `FIREBASE_CONFIG` environment variable

### 5. Server Initialization Updates

#### File: `server/index-prod.ts` (UPDATED)
- Added `initializeFirebase()` call before starting app
- Ensures Firebase is initialized before any Firestore operations

#### File: `server/index-dev.ts` (UPDATED)
- Added optional Firebase initialization
- Initializes Firebase if `NODE_ENV=production` OR `USE_FIRESTORE=true`
- Allows testing Firestore locally during development

### 6. API Routes - No Changes Required
#### File: `server/routes.ts`
- All existing API routes remain unchanged
- Routes work with any `IStorage` implementation
- Transparent switching between MemStorage and FirestoreStorage

### 7. Schema - No Breaking Changes
#### File: `shared/schema.ts`
- Validation schema remains the same
- Zod schemas still used for request validation
- Firestore storage handles type conversions internally

## Data Model

### Firestore Collection: `coffees`

```typescript
interface CoffeeDocument {
  id: string;                    // Document ID (auto-generated or custom)
  brandName: string;             // Coffee brand name
  quantity: string;              // Quantity ordered
  orderDate: Timestamp;          // Order date (as Firestore Timestamp)
  roast: string;                 // Roast level
  formFactor: string;            // Form factor (beans, grounds, etc.)
  notes: string;                 // Tasting notes
  bitternessRating: number;      // 1-10 rating
  acidityRating: number;         // 1-10 rating
  noteClarityRating: number;     // 1-10 rating
  overallTasteRating: number;    // 1-10 rating
  worthReordering: number;       // 0 or 1 (boolean as number)
  createdAt: Timestamp;          // Auto-set on creation
}
```

## Environment Variables

### Development
```bash
NODE_ENV=development                    # Default: uses MemStorage
USE_FIRESTORE=true                      # Optional: use Firestore instead
FIREBASE_CONFIG='...'                   # Service account key JSON (if using Firestore)
```

### Production (GCP)
```bash
NODE_ENV=production                     # Uses Firestore automatically
# No explicit config needed - uses Application Default Credentials
```

## Running the App

### Development (In-Memory Storage - Default)
```bash
npm install
npm run dev
```

### Development (With Firestore - Local Testing)
```bash
# Set up service account key
export FIREBASE_CONFIG=$(cat service-account-key.json | jq -c .)
export USE_FIRESTORE=true
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### For GCP Deployment
Follow the instructions in [GCP_FIRESTORE_SETUP.md](./GCP_FIRESTORE_SETUP.md)

## Breaking Changes

**None for API consumers!**

- The REST API remains identical
- All endpoints work the same way
- Response formats unchanged
- Error handling preserved

The migration is entirely transparent to the client application.

## Migration Checklist

- [x] Add Firebase Admin SDK dependency
- [x] Create Firestore storage implementation
- [x] Create Firebase initialization module
- [x] Update storage selection logic
- [x] Update server initialization files
- [x] Remove PostgreSQL dependencies
- [x] Create GCP setup guide
- [x] Create environment variable template
- [ ] Run `npm install` to fetch new dependencies
- [ ] Set up GCP project (see GCP_FIRESTORE_SETUP.md)
- [ ] Deploy to production

## Troubleshooting

### TypeScript Errors After npm install
```bash
npm run check
# Should pass after dependencies are installed
```

### Firebase Module Not Found
```bash
npm install
# The firebase-admin package must be installed before running
```

### Firestore Connection Issues
- Check `FIREBASE_CONFIG` environment variable format
- Verify GCP project ID is correct
- Confirm service account has Firestore permissions

### Data Conversion Issues
- Dates are stored as Firestore `Timestamp` objects
- They're automatically converted to ISO date strings on retrieval
- All other fields maintain their original types

## Next Steps

1. **Install dependencies**: `npm install`
2. **Test locally**: `npm run dev` (uses MemStorage by default)
3. **Test with Firestore**: Follow development steps in GCP_FIRESTORE_SETUP.md
4. **Deploy to GCP**: Follow production steps in GCP_FIRESTORE_SETUP.md

See [GCP_FIRESTORE_SETUP.md](./GCP_FIRESTORE_SETUP.md) for detailed deployment instructions.
