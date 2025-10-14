# Promo Code Redemption Guide

Complete guide for implementing and using promo code redemption in the Stealth Chat mobile app.

## Overview

The app supports promo code redemption for both Google Play (Android) and Apple App Store (iOS). Users can redeem codes to unlock premium subscriptions or special offers.

## Platform-Specific Implementation

### Google Play (Android)

**Promo Code Types:**
- **One-time use codes**: Auto-generated unique codes (up to 10,000 per quarter)
- **Custom codes**: Memorable codes you create (up to 99,999 redemptions per code)

**How to Create Promo Codes:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Monetize with Play → Promo codes**
3. Select **Subscription** type
4. Choose code type (one-time or custom)
5. Set promotion details:
   - Start/end dates (max 1 year)
   - Status: On/Paused
6. Click **Create** and download codes

**Redemption Flow:**
- Users redeem via Play Store: `https://play.google.com/redeem?code=YOUR_CODE`
- Or in-app: Google Play dialog appears automatically during purchase
- The app logs redemption attempts for analytics

**Important Limits:**
- One-time codes: 10,000 per quarter per subscription
- Custom codes: 2,000-99,999 redemptions per promotion
- Codes expire: One-time codes (28 days), Custom codes (up to 6 months)

### Apple App Store (iOS)

**Offer Code Types:**
- **One-time use codes**: Unique codes (up to 100 per product, max 1,000 every 6 months)
- **Custom codes**: Memorable codes (up to 25,000 redemptions per code)

**How to Create Offer Codes:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Apps → Your App → Subscriptions**
3. Select subscription group and product
4. In **Subscription Prices** → Click **(+)** → **Create Offer Codes**
5. Configure:
   - Reference name (internal)
   - Offer type (Free, Pay As You Go, Pay Up Front)
   - Duration (matches subscription period)
   - Customer eligibility (New, Active, Expired)
   - Territories
6. Generate codes (one-time or custom)

**Redemption Flow:**
- Direct URL: `https://apps.apple.com/redeem?ctx=offercodes&id=APP_ID&code=CODE`
- In-app: Native redemption sheet (iOS 14+)
- App Store settings: Manual redemption

**Important Limits:**
- Redemption cap: 1 million per app per quarter (shared across all codes)
- Custom code redemptions: Up to 25,000 per code
- Code expiration: One-time (28 days), Custom (6 months max or no expiration)

## App Implementation

### Configuration Requirements

**Environment Variables:**
Set these before building the mobile app:

```bash
# Required for iOS promo code redemption
export VITE_APP_STORE_ID=YOUR_APP_STORE_ID

# Example:
export VITE_APP_STORE_ID=6738359693
```

**Finding Your App Store ID:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to App Information
4. Copy the Apple ID (numeric value)

### Deep Link Support

The app supports custom deep links for seamless code redemption:

**Deep Link Format:**
```
stealthchat://redeem?code=PROMOCODE123
```

**Native Configuration Required:**

**iOS (Info.plist):**
Add this to `ios/App/App/Info.plist` inside the `<dict>` tag:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>stealthchat</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.newhomepage.stealthchat</string>
  </dict>
</array>
```

**Android (AndroidManifest.xml):**
Add this to `android/app/src/main/AndroidManifest.xml` inside the `<activity>` tag:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="stealthchat" android:host="redeem" />
</intent-filter>
```

**How It Works:**
1. User clicks deep link (from email, SMS, social media, etc.)
2. App opens and extracts the promo code
3. User is directed to Settings page
4. Redemption dialog auto-opens with code pre-filled
5. User confirms redemption

### UI Components

**Promo Code Redemption Button:**
- Located in Settings page (for free users)
- Opens redemption dialog
- Shows redemption history (last 3 redemptions)

**Features:**
- Platform detection (iOS/Android)
- Auto-population from deep links
- Input validation (uppercase conversion)
- Redemption status tracking
- Error handling with user-friendly messages

### Backend API

**Endpoints:**

1. **Log Redemption Attempt**
   ```
   POST /api/promo-code/log-redemption
   Body: { platform: "ios" | "android", promoCode: string }
   ```

2. **Get Redemption History**
   ```
   GET /api/promo-code/history
   Returns: { redemptions: PromoCodeRedemption[] }
   ```

3. **Generate Redemption URL**
   ```
   POST /api/promo-code/generate-url
   Body: { platform: "ios" | "android", promoCode: string, appId?: string }
   Returns: { url: string }
   ```

### Database Schema

**Table: `promo_code_redemptions`**
- `id`: Unique identifier (VARCHAR with UUID)
- `user_id`: User who attempted redemption (references users.id)
- `platform`: "ios" or "android" (TEXT)
- `promo_code`: The code value for analytics (TEXT)
- `status`: "pending", "success", or "failed" (TEXT, default: "pending")
- `error_message`: Error details if failed (TEXT, nullable)
- `subscription_id`: Link to created subscription if successful (VARCHAR, references mobile_subscriptions.id, nullable)
- `created_at`, `updated_at`: Timestamps

**Database Migration:**

The table has already been created using direct SQL execution. If you need to recreate it or deploy to a new environment:

```sql
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL,
  promo_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  subscription_id VARCHAR REFERENCES mobile_subscriptions(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

Or use Drizzle schema push (ensure schema is in `shared/schema.ts`):
```bash
npm run db:push --force
```

## Testing Promo Codes

### Google Play Testing

**Important Setup:**
1. Remove your email from **License Testers** in Play Console
   - Go to **Setup → License Testing**
   - License testers can only use test payment methods
2. Wait for promotion status to change from "Scheduled" to "Live"
3. Use multiple test accounts to validate eligibility rules

**Test Redemption:**
- In-app: Attempt subscription purchase → Select "Redeem code" from payment dropdown
- Browser: Open `https://play.google.com/redeem?code=YOUR_CODE`
- App deep link: `stealthchat://redeem?code=YOUR_CODE`

### Apple App Store Testing

**Sandbox Testing:**
1. Create test offer in sandbox environment
2. Use TestFlight or physical device (iOS 14+)
3. Test with sandbox Apple ID

**Test Redemption:**
- Direct URL: `https://apps.apple.com/redeem?ctx=offercodes&id=APP_ID&code=CODE`
- In-app sheet: Trigger native redemption UI
- App deep link: `stealthchat://redeem?code=YOUR_CODE`

**Common Issues:**
- Redemption sheet unstable → Use direct URLs as fallback
- Code not working → Wait up to 1 hour after creation
- TestFlight inconsistencies → Test on physical device

## Distribution Strategies

### Email Campaigns
```html
<a href="stealthchat://redeem?code=SAVE20NOW">Redeem Your 20% Discount!</a>
```

### Social Media
Share custom codes directly:
- "Use code SAVE20NOW for 20% off premium!"
- Works great for influencer partnerships

### Physical Events
Print custom codes on:
- Flyers
- Business cards
- Booth displays
- QR codes linking to deep links

### SMS/Push Notifications
```
🎉 Special offer! Use code SAVE20NOW to get 20% off.
Redeem here: stealthchat://redeem?code=SAVE20NOW
```

### Customer Support
Generate one-time codes for:
- Service recovery
- Loyalty rewards
- Complaint resolution

## Analytics & Monitoring

**Track Redemption Performance:**
- View redemption attempts in `promo_code_redemptions` table
- Monitor success/failure rates
- Track conversion by code
- Identify popular distribution channels

**Key Metrics:**
- Total redemptions per code
- Success rate (successful / attempted)
- Platform breakdown (iOS vs Android)
- Time-to-redemption
- User acquisition via codes

## Best Practices

### Code Creation
✅ Use memorable custom codes (SAVE20NOW vs. random strings)  
✅ Communicate expiration dates clearly  
✅ Set appropriate redemption limits  
✅ Test codes before distribution  

### Distribution
✅ Use deep links for seamless experience  
✅ Include clear redemption instructions  
✅ Track which channels drive redemptions  
✅ A/B test different code formats  

### Customer Experience
✅ Auto-populate codes from deep links  
✅ Show clear error messages  
✅ Display redemption history  
✅ Provide support for failed redemptions  

### Security
✅ Log all redemption attempts  
✅ Monitor for abuse patterns  
✅ Set appropriate rate limits  
✅ Expire unused codes  

## Troubleshooting

### Android Issues

**Promo code option not showing:**
- Remove account from License Testers in Play Console
- Ensure promotion status is "Live" (not "Scheduled")

**Code invalid error:**
- Wait up to 1 hour after code creation
- Verify promotion is active (not paused or expired)
- Check user eligibility (custom codes only for new subscribers)

**Deep link not working:**
- Verify URL scheme in `capacitor.config.ts`
- Check Android app links configuration
- Test with `adb shell am start -W -a android.intent.action.VIEW -d "stealthchat://redeem?code=TEST"`

### iOS Issues

**Redemption sheet not appearing:**
- Requires iOS 14+ for native sheet
- Fall back to web URL if unavailable
- Check StoreKit availability

**Code not recognized:**
- Wait up to 1 hour after creation
- Verify offer is active
- Check user eligibility settings

**Deep link not opening app:**
- Verify URL scheme in `capacitor.config.ts`
- Check iOS universal links configuration
- Test with Safari: `stealthchat://redeem?code=TEST`

### General Issues

**Backend not logging redemption:**
- Check authentication status
- Verify API endpoint availability
- Review browser/app console for errors

**Purchase not completing:**
- Verify store credentials are configured
- Check receipt validation implementation
- Review webhook notification setup

## Next Steps

1. **Create Promo Codes:**
   - Set up codes in Google Play Console
   - Set up offer codes in App Store Connect

2. **Configure Store Credentials:**
   - Google Play Developer API service account
   - Apple App Store Connect API key

3. **Test Redemption Flow:**
   - Test with sandbox accounts
   - Verify deep links work correctly
   - Test all distribution channels

4. **Launch Campaign:**
   - Distribute codes via chosen channels
   - Monitor redemption analytics
   - Optimize based on performance

## Resources

### Google Play
- [Promo Codes Documentation](https://developer.android.com/google/play/billing/promo)
- [Play Console Help](https://support.google.com/googleplay/android-developer/answer/6321495)
- [Billing Library Migration](https://developer.android.com/google/play/billing/migrate)

### Apple App Store
- [Offer Codes Documentation](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-offer-codes/)
- [Subscription Offers Tech Talk](https://developer.apple.com/videos/play/tech-talks/10868/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit)

### App Configuration
- Deep link setup: `capacitor.config.ts`
- Backend APIs: `server/routes.ts` (lines 571-640)
- Frontend UI: `client/src/components/promo-code-redeem.tsx`
- Database schema: `shared/schema.ts` (promoCodeRedemptions table)
