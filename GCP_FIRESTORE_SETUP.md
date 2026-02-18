# GCP Firestore Setup Guide

This guide explains how to migrate the Coffee Journal app from in-memory storage to Google Cloud Firestore.

## Prerequisites

- A Google Cloud Platform (GCP) account
- `gcloud` CLI installed and configured
- `firebase-cli` installed
- Docker (for local development)

## Step 1: Create a GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create a new GCP project
gcloud projects create $PROJECT_ID --name="Coffee Journal App"

# Set as default project
gcloud config set project $PROJECT_ID
```

## Step 2: Enable Required APIs

```bash
# Enable Firestore API
gcloud services enable firestore.googleapis.com

# Enable Cloud Run (if deploying there)
gcloud services enable run.googleapis.com

# Enable Cloud Build (if deploying there)
gcloud services enable cloudbuild.googleapis.com
```

## Step 3: Create a Firestore Database

```bash
# Create a Firestore database in native mode
# You'll be prompted to select a location
gcloud firestore databases create --location=us-central1

# Or for EU:
# gcloud firestore databases create --location=europe-west1
```

## Step 4: Set Up Authentication (Service Account)

For production deployment on GCP, the app automatically uses Application Default Credentials (ADC).

### For Local Development

Create a service account key:

```bash
# Create a service account
gcloud iam service-accounts create coffee-journal-app \
  --display-name="Coffee Journal App Service Account"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:coffee-journal-app@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Create a key file
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=coffee-journal-app@$PROJECT_ID.iam.gserviceaccount.com
```

### Set Environment Variable for Development

```bash
# For development with Firestore
export FIREBASE_CONFIG=$(cat ./service-account-key.json | jq -c .)
export USE_FIRESTORE=true
npm run dev
```

Or add to `.env` file:

```bash
# .env
NODE_ENV=development
USE_FIRESTORE=true
FIREBASE_CONFIG='{"type":"service_account","project_id":"your-project-id",...}'
```

## Step 5: Update & Install Dependencies

Dependencies have been updated in `package.json`:
- Added `firebase-admin` for server-side Firebase operations
- Removed `drizzle-orm` and `drizzle-kit` (no longer needed for Firestore)

Install the new dependencies:

```bash
npm install
```

## Step 6: Firestore Collection Structure

The app automatically creates a `coffees` collection with documents containing:

```json
{
  "id": "document-id",
  "brandName": "string",
  "quantity": "string",
  "quantityUnit": "string",  # "g" or "kg"
  "orderDate": "Timestamp",
  "roast": "string",
  "formFactor": "string",
  "notes": "string",
  "bitternessRating": "number (1-10)",
  "acidityRating": "number (1-10)",
  "noteClarityRating": "number (1-10)",
  "overallTasteRating": "number (1-10)",
  "worthReordering": "number (0 or 1)",
  "createdAt": "Timestamp"
}
```

## Step 7: Deploy to Cloud Run

### 1. Build Docker Image

```bash
# Build the project
npm run build

# Create Dockerfile (already exists in repo)
# It should build the app and serve with Node
```

### 2. Configure Cloud Run Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy coffee-journal-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --memory 512Mi \
  --timeout 3600
```

### 3. Using Cloud Build (Automated)

Create a `cloudbuild.yaml`:

```yaml
steps:
  # Build the image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/coffee-journal-app:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/coffee-journal-app:latest'
      - '.'

  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/coffee-journal-app:$SHORT_SHA'

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/coffee-journal-app:$SHORT_SHA
      - --location=us-central1
      - --output=/workspace/output

images:
  - 'gcr.io/$PROJECT_ID/coffee-journal-app:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/coffee-journal-app:latest'
```

Then trigger deployment:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Step 8: Deploy to App Engine

Alternative deployment to App Engine:

```bash
# Create app.yaml
cat > app.yaml << EOF
runtime: nodejs20

env: standard

env_variables:
  NODE_ENV: "production"

handlers:
- url: /.*
  script: auto
EOF

# Deploy
gcloud app deploy
```

## Step 9: View Firestore Data

```bash
# View collections and documents
gcloud firestore databases list

# Export data (optional)
gcloud firestore export gs://your-bucket/firestore-export
```

## Firestore Security Rules

When ready for production, set up security rules. Edit in [Google Cloud Console](https://console.cloud.google.com/firestore):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coffees/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For now (development), you can use:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Environment Variables Summary

### Development
```bash
NODE_ENV=development
USE_FIRESTORE=true  # Optional, uses MemStorage by default
FIREBASE_CONFIG=(service account key as JSON string)
```

### Production
```bash
NODE_ENV=production
# Automatically uses Application Default Credentials from GCP
```

## Troubleshooting

### "Collection not found" Error
- Firestore collections are created automatically on first document write
- The app creates the collection on the first coffee entry

### "Permission denied" Error
- Check that the service account has `roles/datastore.user` role
- For Cloud Run/App Engine, the default service account needs Firestore permissions

### Local Development Connection Issues
- Ensure `service-account-key.json` is valid
- Verify `FIREBASE_CONFIG` environment variable is set correctly
- Check that the Firestore database is in the same GCP project

### Data Migration from Previous Storage
If migrating data from PostgreSQL/another database:

```bash
# Export data from your current database
# Then use Firebase Admin SDK to bulk import:

# Create a migration script (example):
# server/migrate.ts

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require('../service-account-key.json');

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

async function migrate() {
  // Import your existing data here
  // db.collection('coffees').doc(id).set(data)
}

migrate().catch(console.error);
```

## References

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/database/admin/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
