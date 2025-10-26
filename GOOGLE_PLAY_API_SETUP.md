# Google Play Developer API Setup Guide

This guide explains how to set up real Google Play API validation for PrivyCalc subscriptions.

## Overview

The app currently runs in **TEST MODE** (accepts all purchases). To enable **PRODUCTION MODE** with real validation, you need to:
1. Create a Google Cloud service account
2. Enable the Google Play Developer API
3. Grant permissions in Google Play Console
4. Add the service account JSON key as a secret

---

## Step 1: Create Service Account in Google Cloud

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Create a new project or select existing one
- Name it something like "PrivyCalc API"

### 1.2 Enable Google Play Android Developer API
- Go to **APIs & Services** → **Library**
- Search for "Google Play Android Developer API"
- Click **Enable**
- Direct link: https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com

### 1.3 Create Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Enter details:
   - **Name**: `privycalc-api-validator`
   - **Description**: `Service account for validating Google Play purchases`
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**

### 1.4 Generate JSON Key
1. Find your service account in the list
2. Click the **three dots (⋮)** → **Manage Keys**
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded JSON file securely
7. **IMPORTANT**: Copy the service account email (format: `xxx@yyy.iam.gserviceaccount.com`)

---

## Step 2: Grant Permissions in Google Play Console

### 2.1 Invite Service Account
1. Go to **Google Play Console**: https://play.google.com/console
2. Navigate to **Users and permissions**
3. Click **Invite new users**
4. Paste your **service account email** (from step 1.4)

### 2.2 Set App Permissions
1. In the invitation dialog, click **App permissions** tab
2. Select **PrivyCalc** (com.newhomepage.privychat)
3. Click **Apply**

### 2.3 Set Account Permissions
1. Click **Account permissions** tab
2. Enable these permissions:
   - ✅ **View app information and download bulk reports**
   - ✅ **View financial data, orders, and cancellation survey responses**
   - ✅ **Manage orders and subscriptions**
3. Click **Invite user**

### 2.4 Wait for Activation
- **Important**: Service accounts can take **24-36 hours** to become active
- You may see 401/403 errors during this period

**Pro tip**: To potentially activate faster:
- Go to **Monetize** → **Subscriptions**
- Edit any product (change description)
- Save and revert the change
- This sometimes triggers activation within minutes

---

## Step 3: Add Service Account to Replit

### 3.1 Open Your JSON Key File
Open the downloaded JSON file. It looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-12345",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "xxx@yyy.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

### 3.2 Add as Replit Secret
1. In Replit, open the **Secrets** tool (🔒 icon in left sidebar)
2. Click **Add new secret**
3. **Key**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
4. **Value**: Paste the **entire JSON content** (all of it!)
5. Click **Add secret**

---

## Step 4: Test Production Validation

### 4.1 Server Will Auto-Switch to Production Mode
Once you add the `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret, the server automatically switches from TEST MODE to PRODUCTION MODE.

### 4.2 Check Server Logs
After adding the secret, make a test purchase and watch the server logs. You should see:
```
✅ Service account configured - using PRODUCTION validation
📞 Calling Google Play API...
✅ API Response received
   Order ID: GPA.xxxx-xxxx-xxxx-xxxxx
   Payment State: 1
   Auto-Renewing: true
📊 Validation result:
   Valid: true
   Expiry: 2026-10-26T...
   Purchase Date: 2025-10-26T...
   Payment State: Received
```

### 4.3 Troubleshooting

**Error: 401 Unauthorized**
- Service account not activated yet (wait 24-36 hours)
- Try the "edit product" trick to force activation

**Error: 403 Forbidden**
- Service account doesn't have correct permissions
- Go back to Play Console → Users and permissions → Verify permissions

**Error: 404 Not Found**
- Purchase token is invalid or expired
- Package name doesn't match
- Product ID doesn't match

**Still seeing "TEST MODE"**
- Secret not added correctly
- Server hasn't restarted (workflows auto-restart after adding secrets)
- Check secret name is exactly: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

---

## Security Best Practices

1. ✅ **Never commit the JSON key to git** - It's stored as a Replit secret
2. ✅ **Rotate keys periodically** - Create new keys every 90 days
3. ✅ **Limit permissions** - Only grant what's needed for subscription validation
4. ✅ **Monitor API usage** - Check Google Cloud Console for unusual activity

---

## API Limits

- **Default quota**: 200,000 requests/day per application
- **Rate limiting**: The server caches subscription data to minimize API calls
- **Subscription queries**: Subscriptions expired >60 days ago cannot be queried (410 error)

---

## Current Status

**✅ Code is ready** - The server already has production API validation implemented
**⏳ Waiting for setup** - You just need to add the service account JSON secret
**🧪 Running in TEST MODE** - Until you add the secret, all purchases are accepted for testing

Once you complete these steps, PrivyCalc will have production-grade subscription validation! 🎉
