# Google Cloud Pub/Sub Webhook Setup Guide

This guide explains how to configure Google Cloud Pub/Sub with JWT authentication for the Google Play webhook endpoint.

## Overview

The webhook endpoint `/api/mobile-subscription/webhook/google` now verifies JWT tokens from Google Cloud Pub/Sub to prevent spoofed webhook calls. This ensures that only authenticated requests from Google are processed.

## Prerequisites

- Google Play Console access with Real-time Developer Notifications configured
- Google Cloud Console access to the project
- A deployed PrivyCalc server with a public HTTPS URL

## Setup Steps

### 1. Grant IAM Permissions

The Pub/Sub service agent needs permission to create authentication tokens:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:service-PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator
```

Replace:
- `YOUR_PROJECT_ID` with your Google Cloud project ID
- `PROJECT_NUMBER` with your Google Cloud project number

### 2. Create a Service Account (if not already created)

```bash
gcloud iam service-accounts create pubsub-webhook \
  --display-name="Pub/Sub Webhook Service Account" \
  --project=YOUR_PROJECT_ID
```

### 3. Configure the Pub/Sub Topic

Your topic name should be in the format:
```
projects/{project_id}/topics/{topic_name}
```

For example:
```
projects/my-project-12345/topics/google-play-notifications
```

### 4. Create an Authenticated Push Subscription

Create a push subscription with JWT authentication enabled:

```bash
gcloud pubsub subscriptions create google-play-webhook-sub \
  --topic=google-play-notifications \
  --push-endpoint=https://your-domain.replit.app/api/mobile-subscription/webhook/google \
  --push-auth-service-account=pubsub-webhook@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --push-auth-token-audience=https://your-domain.replit.app \
  --project=YOUR_PROJECT_ID
```

Replace:
- `YOUR_PROJECT_ID` with your Google Cloud project ID
- `your-domain.replit.app` with your actual Replit app domain

### 5. Configure Environment Variables

#### Required for Production

Set the service account email to verify JWT authenticity:

```bash
PUBSUB_SERVICE_ACCOUNT_EMAIL=pubsub-webhook@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Replace `YOUR_PROJECT_ID` with your Google Cloud project ID.

**Security Warning**: Without this variable, the webhook will accept JWTs from ANY Google service account, not just yours. This allows attackers to spoof webhook calls.

#### Optional Audience Override

By default, the webhook uses the request hostname as the audience. To override this:

```bash
PUBSUB_AUDIENCE=https://your-domain.replit.app
```

## How JWT Verification Works

When Google Cloud Pub/Sub sends a push notification:

1. **Google signs the request** with a JWT token
2. **Token is sent** in the `Authorization: Bearer <TOKEN>` header
3. **Your server verifies**:
   - The JWT signature using Google's public keys
   - The issuer is `https://accounts.google.com`
   - The audience matches your configured endpoint URL
   - **The service account email matches** your expected account (prevents spoofing)
4. **If verification passes**, the webhook processes the notification
5. **If verification fails**, returns 403 Forbidden

## JWT Token Structure

The JWT contains these claims:
```json
{
  "iss": "https://accounts.google.com",
  "aud": "https://your-domain.replit.app",
  "email": "pubsub-webhook@your-project.iam.gserviceaccount.com",
  "email_verified": true,
  "exp": 1234567890,
  "iat": 1234567890
}
```

## Testing

### Development Mode
The webhook automatically detects development mode when:
- `NODE_ENV` is not set to `production`, AND
- `PUBSUB_SERVICE_ACCOUNT_EMAIL` is not configured

In development mode, requests without JWT tokens are allowed for local testing. You'll see:
```
⚠️ DEVELOPMENT MODE: No Authorization header - allowing for local testing
```

### Production Mode
Authentication is **automatically enforced** when:
- `NODE_ENV=production`, OR
- `PUBSUB_SERVICE_ACCOUNT_EMAIL` is set

In production mode:
- Requests without Authorization headers are **rejected with 401**
- JWTs from wrong service accounts are **rejected with 403**
- Only properly authenticated Pub/Sub requests are processed

**Security**: Once you set `PUBSUB_SERVICE_ACCOUNT_EMAIL`, authentication is required regardless of NODE_ENV.

### Manual JWT Testing

You can decode a JWT token to inspect its contents:
```bash
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq
```

Verify a token with Google's API:
```bash
curl "https://oauth2.googleapis.com/tokeninfo?id_token=YOUR_JWT_TOKEN"
```

## Troubleshooting

### Error: "Malformed Authorization header"
- **Cause**: Authorization header present but not in `Bearer <token>` format
- **Fix**: Ensure push subscription is configured with proper authentication

### Error: "Invalid authentication token"
- **Cause**: JWT signature verification failed
- **Fix**: Check that the service account has the correct permissions and the subscription is configured with authentication

### Error: "Invalid token issuer"
- **Cause**: The token issuer is not `https://accounts.google.com`
- **Fix**: Verify the token is coming from Google Cloud Pub/Sub

### Error: "Invalid service account"
- **Cause**: JWT email claim doesn't match `PUBSUB_SERVICE_ACCOUNT_EMAIL`
- **Fix**: Ensure the environment variable matches the service account used in your push subscription

### Warning: "No Authorization header"
- **Cause**: Push subscription not configured with authentication
- **Fix**: Recreate the subscription with `--push-auth-service-account` flag

### Error: Audience mismatch
- **Cause**: The `aud` claim doesn't match your endpoint URL
- **Fix**: Ensure `--push-auth-token-audience` matches your server URL exactly

## Security Best Practices

1. ✅ **Always use HTTPS** - HTTP endpoints are not secure
2. ✅ **Verify the JWT** - Don't trust unauthenticated requests in production
3. ✅ **Set correct audience** - Use your exact domain, not wildcards
4. ✅ **Monitor logs** - Watch for failed authentication attempts
5. ✅ **Rotate credentials** - Periodically update service account keys

## Google Play Console Configuration

In Google Play Console:
1. Go to **Monetization setup** > **Real-time developer notifications**
2. Enter your topic name: `projects/{project_id}/topics/{topic_name}`
3. Click **Send test notification** to verify the setup

The webhook will receive and process:
- Subscription cancellations (type 3)
- Subscription renewals (type 2)
- Subscription expirations (type 13)
- Subscription revocations (type 12)

## References

- [Google Cloud Pub/Sub Push Authentication](https://cloud.google.com/pubsub/docs/authenticate-push-subscriptions)
- [JWT Verification Guide](https://cloud.google.com/pubsub/docs/push#authentication)
- [Google Play Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)

---

**Status**: JWT verification is implemented and ready for production use once you configure the authenticated push subscription.
