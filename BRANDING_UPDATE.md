# PrivyCalc Branding Update Summary

## ✅ What Was Changed

The app has been completely rebranded from "SecureCalc/StealthChat" to **PrivyCalc** with the domain **PrivyCalc.com**.

## 📝 Updated Files

### App Configuration
- ✅ `capacitor.config.ts` - App name changed to "PrivyCalc"
- ✅ `android/app/src/main/res/values/strings.xml` - Android app name
- ✅ `client/public/manifest.json` - Web manifest name
- ✅ `replit.md` - Main documentation updated

### Legal & Privacy
- ✅ `client/src/components/legal-content.tsx` - Complete privacy policy and terms rewritten for PrivyCalc.com
  - Privacy Policy updated to reflect PrivyCalc services
  - Terms of Use customized for secure messaging app
  - Contact emails updated (support@PrivyCalc.com, privacy@PrivyCalc.com, legal@PrivyCalc.com)
  - Company address removed (use your actual business address when ready)

### Documentation
- ✅ `CAPACITOR_BUILD_GUIDE.md` - Updated to PrivyCalc
- ✅ `PROMO_CODE_GUIDE.md` - Updated app name
- ✅ `REMOTE_MODE_GUIDE.md` - Updated examples with PrivyCalc.com
- ✅ `STEALTH_CALCULATOR_ICONS.md` - Updated branding

### Deep Links
- ✅ `capacitor.config.ts` - URL scheme changed from `stealthchat://` to `privycalc://`
- ✅ `client/src/hooks/use-deep-links.ts` - Comments updated to reflect new scheme
- ✅ `PROMO_CODE_GUIDE.md` - Deep link examples updated

## 🌐 Domain Configuration

**Primary Domain**: PrivyCalc.com  
**Deep Link Scheme**: privycalc://  
**Package Name**: com.newhomepage.stealthchat (unchanged - better not to change for published apps)

## 📧 Email Addresses

Update these in your email service (SendGrid):
- **Support**: support@PrivyCalc.com
- **Privacy**: privacy@PrivyCalc.com
- **Legal**: legal@PrivyCalc.com

## 📱 Mobile App Updates

### Display Names
- **iOS**: PrivyCalc
- **Android**: PrivyCalc
- **Web**: PrivyCalc

### URL Schemes
Old: `stealthchat://redeem?code=CODE`  
New: `privycalc://redeem?code=CODE`

## 🚀 Next Steps

1. **Domain Setup**
   - Point PrivyCalc.com to your Replit published URL
   - Set up DNS records
   - Configure SSL certificate (automatic with Replit publishing)

2. **Email Configuration**
   - Set up email addresses at PrivyCalc.com
   - Configure SendGrid with verified sender
   - Update `SENDGRID_FROM_EMAIL` environment variable

3. **Mobile App Publishing**
   - Update app store listings with "PrivyCalc" name
   - Upload new calculator icons (already generated)
   - Update screenshots if they show old branding
   - Configure deep links in native projects (see PROMO_CODE_GUIDE.md)

4. **Legal Updates**
   - Add your actual business address to privacy policy
   - Review terms of use for any business-specific requirements
   - Consult legal counsel for jurisdiction-specific compliance

5. **Environment Variables**
   ```bash
   export VITE_PUBLISHED_URL=PrivyCalc.com  # or privycalc.replit.app
   export VITE_APP_STORE_ID=YOUR_APP_STORE_ID
   export SENDGRID_FROM_EMAIL=support@PrivyCalc.com
   ```

## ⚠️ Important Notes

- **Package Name**: Kept as `com.newhomepage.stealthchat` to avoid breaking existing mobile builds
- **Icons**: Already updated with calculator theme - perfect for stealth
- **Deep Links**: Native projects need manual updates (Info.plist and AndroidManifest.xml)

## ✨ What Didn't Change

- Database schema
- Package names (intentional)
- Core functionality
- Subscription system
- Authentication system

## 🎯 Brand Identity

**PrivyCalc** = Privacy + Calculator

Perfect name for a stealth messaging app that:
- ✅ Looks like a calculator
- ✅ Emphasizes privacy ("Privy" = private, secret)
- ✅ Short, memorable, professional
- ✅ Available domain: PrivyCalc.com
