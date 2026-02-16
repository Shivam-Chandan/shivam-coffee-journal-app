# Quick Start: Deploy to GCP Cloud Run

This is a quick guide to deploy the Coffee Journal app to Google Cloud Run. For more detailed instructions, see [GCP_FIRESTORE_SETUP.md](./GCP_FIRESTORE_SETUP.md).

## Prerequisites

- GCP account
- `gcloud` CLI installed and authenticated: `gcloud auth login`
- Docker installed (for local testing)

## Step-by-Step Deployment

### 1. Set Environment Variables

```bash
# Set your GCP project ID
export PROJECT_ID="your-project-id"
export REGION="us-central1"  # or your preferred region

# Verify the project
gcloud config set project $PROJECT_ID
gcloud projects describe $PROJECT_ID
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com
```

### 3. Create Firestore Database

```bash
# Create a Firestore database (if you haven't already)
gcloud firestore databases create --location=$REGION
```

### 4. Build and Deploy to Cloud Run

```bash
# Build and deploy directly from source (easiest)
gcloud run deploy coffee-journal-app \
  --source=. \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --timeout=3600 \
  --set-env-vars NODE_ENV=production
```

That's it! The deployment will:
1. Build the Docker image
2. Push it to Google Artifact Registry
3. Deploy it to Cloud Run
4. Automatically set up Application Default Credentials for Firestore access

### 5. View Your Deployment

```bash
# Get the service URL
gcloud run services describe coffee-journal-app --region=$REGION --format='value(status.url)'

# View logs
gcloud run services logs read coffee-journal-app --region=$REGION

# Set up continuous logging
gcloud run services logs read coffee-journal-app --region=$REGION --follow
```

## Alternative: Build and Push Manually

If you prefer more control:

```bash
# Build the Docker image locally
docker build -t gcr.io/$PROJECT_ID/coffee-journal-app:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/coffee-journal-app:latest

# Deploy from the pushed image
gcloud run deploy coffee-journal-app \
  --image=gcr.io/$PROJECT_ID/coffee-journal-app:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --set-env-vars NODE_ENV=production
```

## Environment Variables

The app automatically uses Application Default Credentials on GCP. No additional configuration needed!

Optional environment variables you can set:

```bash
gcloud run deploy coffee-journal-app \
  --update-env-vars \
  NODE_ENV=production,\
  PORT=8080
```

## Firestore Security Rules

Set up security rules for your Firestore database:

1. Go to [Google Cloud Console](https://console.cloud.google.com/firestore)
2. Select your project
3. Click on **Rules**
4. Update rules (example for authenticated users):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coffees/{coffeeId} {
      // Allow anyone for now (development)
      allow read, write: if true;
      
      // For production with auth:
      // allow read, write: if request.auth != null;
    }
  }
}
```

## Monitoring and Logs

```bash
# View Cloud Run logs
gcloud run services describe coffee-journal-app --region=$REGION

# View Firestore activity
gcloud firestore indexes list

# View metrics in Cloud Console
# Go to: https://console.cloud.google.com/run/detail/$REGION/coffee-journal-app
```

## Troubleshooting

### "Build failed" error
- Check that all files are included in the repository
- Verify `npm install` works locally first
- Check build logs: `gcloud run rollouts describe coffee-journal-app --region=$REGION`

### "Firestore permission denied" error
- Cloud Run uses a default service account
- Grant Firestore permissions:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com \
  --role=roles/datastore.user
```

### "Container image not found" error
- The Docker build may have failed
- Check build logs in Cloud Build
- Try rebuilding locally first: `docker build -t test .`

## Useful Commands

```bash
# List all deployments
gcloud run services list --region=$REGION

# Update an existing deployment
gcloud run deploy coffee-journal-app \
  --source=. \
  --region=$REGION

# View service details
gcloud run services describe coffee-journal-app --region=$REGION

# Delete the service
gcloud run services delete coffee-journal-app --region=$REGION

# Set service to require authentication
gcloud run services update coffee-journal-app \
  --region=$REGION \
  --no-allow-unauthenticated

# View buildpacks logs (for debugging builds)
gcloud builds log `gcloud builds list --limit=1 --format='value(id)'`
```

## Cost Considerations

Cloud Run pricing (as of 2026):
- **Free tier**: 2 million requests/month, 360,000 GB-seconds/month
- **Pay as you go** after free tier

Firestore pricing:
- **Free tier**: 25k reads/day, 25k writes/day
- **Pay as you go** after free tier

This app should easily fit within free tier limits for personal/small use.

## Custom Domain

To use a custom domain:

```bash
gcloud run domain-mappings create \
  --service=coffee-journal-app \
  --domain=yourdomain.com \
  --region=$REGION
```

Then update your DNS records as instructed.

## Continuous Deployment

For automatic deployment on git push, see the main [GCP_FIRESTORE_SETUP.md](./GCP_FIRESTORE_SETUP.md) file for Cloud Build configuration.

## Next Steps

- [Full GCP Setup Guide](./GCP_FIRESTORE_SETUP.md)
- [Firestore Migration Details](./FIRESTORE_MIGRATION.md)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
