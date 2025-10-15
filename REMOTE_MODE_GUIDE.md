# Remote Mode Setup - Quick Guide

## What is Remote Mode?

Your Capacitor app is configured in **REMOTE MODE** - it loads content from your published Replit server instead of bundled files.

## Benefits

✅ **Publish mobile app ONCE** to app stores  
✅ **All frontend updates automatic** - No app store review needed  
✅ **Users get updates instantly** - Just publish to Replit  
✅ **No rebuilding** for frontend changes  

## How It Works

```
Mobile App (Native Shell)
         ↓
  Loads content from
         ↓
Published Replit Server
  (yourapp.replit.app)
```

The mobile app is just a wrapper that displays your web app. When you update your code and publish to Replit, all users see the changes immediately.

## Setup Steps

### Step 1: Publish Your Replit App

1. Click the **Publish** button in Replit
2. Follow the publishing wizard
3. Copy your published URL (e.g., `stealth-chat-abc123.replit.app`)

### Step 2: Configure the URL

**Option A: Environment Variable**
```bash
export VITE_PUBLISHED_URL=yourapp.replit.app
```

**Option B: Edit capacitor.config.ts**
Replace this line:
```typescript
const PUBLISHED_APP_URL = process.env.VITE_PUBLISHED_URL || 'YOUR_PUBLISHED_URL.replit.app';
```

With your actual URL:
```typescript
const PUBLISHED_APP_URL = process.env.VITE_PUBLISHED_URL || 'stealth-chat-abc123.replit.app';
```

### Step 3: Sync to Mobile

```bash
# For Android
npx cap sync android
npx cap open android

# For iOS
npx cap sync ios
npx cap open ios
```

### Step 4: Build and Publish to App Stores (ONE TIME)

Follow the standard app store submission process. This is a **ONE-TIME** step.

## Updating Your App

### Frontend Updates (No App Store Submission)

1. Make your changes in the code
2. Publish to Replit
3. ✅ **Done!** All users get the update instantly

### Native Updates (Requires App Store Submission)

Only if you're changing:
- Native plugins
- Permissions
- App icons/splash screens
- Deep link configuration

Then you need to:
1. Make changes
2. Sync: `npx cap sync`
3. Rebuild and resubmit to app stores

## Testing

### Before Publishing Mobile App:

```bash
# 1. Make sure your Replit app is published
# 2. Configure the URL (see Step 2 above)
# 3. Sync and test
npx cap sync android
npx cap run android  # or ios
```

The app should load your published site. If you see errors, check:
- ✅ Is your Replit app published and accessible?
- ✅ Is the URL correct in `capacitor.config.ts`?
- ✅ Does the URL include `https://`?

## Important Notes

⚠️ **HTTPS Required** - App stores require secure connections  
⚠️ **Published App Required** - The mobile app won't work without a published Replit server  
⚠️ **Cache Considerations** - Users may need to restart the app to see updates  

## Workflow Summary

```
Development Cycle:
1. Code changes → 2. Test locally → 3. Publish to Replit → ✅ Users updated

Native Changes Only:
1. Update native config → 2. npx cap sync → 3. Rebuild → 4. Resubmit to stores
```

## Advantages Over Bundled Mode

| Feature | Remote Mode | Bundled Mode |
|---------|-------------|--------------|
| Frontend updates | Instant (just publish) | Requires app store review |
| App store review time | None (after first publish) | 1-7 days per update |
| Update deployment | Seconds | Days/weeks |
| User update required | No (automatic) | Yes (download from store) |
| Backend API changes | Instant | Instant |
| Build process | Simple (sync only) | Complex (build + sync) |

## Troubleshooting

**Problem**: White screen on mobile app  
**Solution**: Check if your Replit app is published and the URL is correct

**Problem**: App shows old content  
**Solution**: Force-close and restart the app, or clear app data

**Problem**: "Cannot connect to server"  
**Solution**: Verify your published URL is accessible in a browser

**Problem**: WebSocket errors  
**Solution**: Ensure your published URL uses HTTPS (required for WSS)

## Next Steps

1. Publish your Replit app
2. Configure the published URL
3. Build and submit to app stores **ONCE**
4. Enjoy instant updates forever! 🎉
