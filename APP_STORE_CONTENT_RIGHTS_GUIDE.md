# Apple App Store - Content Rights Configuration Guide

**For PrivyCalc (Calculator+) App Submission**

---

## 📋 What is Content Rights?

When submitting your app to the Apple App Store, you'll be asked during the **Submit for Review** process:

> **"Does your app contain, display, or access third-party content?"**

This question appears after you select your build, alongside Export Compliance and Advertising Identifier questions.

---

## ✅ Recommended Answer for PrivyCalc

### **Answer: NO**

**Reasoning:**
- ✅ User-generated content (photos/videos users send) = **NOT third-party** (users are "second party")
- ✅ Content created by users themselves = **NOT third-party**
- ✅ Your own app UI, text, designs = **NOT third-party**
- ✅ Messages between users = **NOT third-party** (user-created content)

### **Exception: If Using Licensed Assets**

**Answer: YES** - Only if you use:
- ❌ Stock photos in app screenshots (Unsplash, Pexels, etc.)
- ❌ Licensed icon sets (even if free with attribution)
- ❌ Any copyrighted logos or trademarks not owned by you

---

## 🎯 For Calculator+ Specifically

### Current App Content Audit

**What PrivyCalc Contains:**

| Content Type | Third-Party? | Notes |
|--------------|--------------|-------|
| Calculator UI | ❌ NO | Created by you |
| Messaging interface | ❌ NO | Created by you |
| User messages (text) | ❌ NO | User-generated (second party) |
| User photos/videos | ❌ NO | User's own content |
| App icon | ❌ NO | Your design |
| Lucide React icons (code) | ❌ NO | MIT license integrated in code |
| Shadcn/UI components | ❌ NO | MIT license, part of your app |

**Recommendation:** Answer **NO** unless you add third-party content later.

---

## 📸 Screenshot Considerations

### If You Use Stock Images in Screenshots:

**Example:** Using stock photos as sample "shared images" in message bubbles for App Store screenshots.

**Then Answer: YES**

**What to prepare:**
1. **License documentation** (even if free)
   - Screenshot of license terms from Unsplash/Pexels
   - Download receipt or license confirmation
   
2. **Attribution** (if required)
   - Add "Credits" section in app Settings
   - List: "Photos in promotional materials from Unsplash"

3. **Keep records ready**
   - Apple may request proof during review
   - Respond via Resolution Center if asked

### If You Use Your Own Photos/Graphics:

**Answer: NO** - You own the copyright

---

## 🔄 What Happens After Answering

### If You Answer **NO**:
- ✅ Continue to submission
- ✅ No additional documentation needed
- ✅ Fastest path to review

### If You Answer **YES**:
- Follow-up question: **"Do you have the rights to use this content?"**
- Answer: **YES**
- ✅ Can still submit (no immediate documentation required)
- 📋 Apple may request proof during review via Resolution Center

---

## 📝 Step-by-Step in App Store Connect

### Location in Submission Flow

1. **App Store Connect** → Your App
2. Click **"+ Version"** or select existing version
3. Add build, screenshots, description, etc.
4. Click **"Submit for Review"**
5. **Content Rights question appears** on submission screen

### How to Complete

```
┌─────────────────────────────────────────────────────────┐
│ Content Rights                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Does your app contain, display, or access              │
│ third-party content?                                    │
│                                                         │
│ ( ) Yes   (•) No                                        │
│                                                         │
│ [Learn More]                                            │
└─────────────────────────────────────────────────────────┘
```

**For PrivyCalc:** Select **No**

**Then click:** Submit for Review ✅

---

## 🛡️ Don't Confuse With Copyright Field

### Different Settings:

#### 1. **Content Rights** (Submission Question)
- Location: Appears during "Submit for Review" flow
- Question: Third-party content?
- For PrivyCalc: **NO**

#### 2. **Copyright** (App Information Field)
- Location: App Store Connect → App Information → General Information
- Field: Copyright
- Format: `2025 PrivyCalc Inc` or `© 2025 Your Company Name`
- Purpose: Who owns the copyright to **your app**
- Required: YES (must be filled)

**Example for PrivyCalc:**
```
Copyright: © 2025 PrivyCalc. All rights reserved.
```

or

```
Copyright: 2025 [Your Legal Entity Name]
```

---

## 📚 If You Add Third-Party Content Later

### Common Scenarios & How to Handle

#### **Scenario 1: Adding Stock Photos in Screenshots**

**Content:** Unsplash/Pexels photos in message preview screenshots

**Action:**
1. Answer: **YES** to Content Rights
2. Answer: **YES** to "Do you have rights?"
3. Keep ready:
   - License screenshot from Unsplash/Pexels
   - URL to their license terms
   - Attribution in app (if required)

**Attribution Location:**
- Add in Settings → About → Credits section
- Format: "Stock photos courtesy of Unsplash (unsplash.com/license)"

---

#### **Scenario 2: Third-Party Service Logos**

**Content:** Display "Send via Email" with Gmail logo, or payment logos (Stripe, etc.)

**Action:**
1. Answer: **YES** to Content Rights
2. Answer: **YES** to "Do you have rights?"
3. Keep ready:
   - Brand guidelines compliance (Google, Stripe brand guidelines allow usage)
   - Screenshot of brand asset download page
   - Proper logo usage (size, spacing per guidelines)

---

#### **Scenario 3: External API Content**

**Content:** Displaying Instagram feed, Twitter timeline, YouTube videos

**Action:**
1. Answer: **YES** to Content Rights
2. Answer: **YES** to "Do you have rights?"
3. Keep ready:
   - API Terms of Service acceptance
   - Screenshot of developer account
   - API documentation showing allowed usage

---

## 🚨 If Apple Requests Documentation

### What to Do:

1. **Check Resolution Center**
   - App Store Connect → Activity → Resolution Center
   - Apple will detail what they need

2. **Prepare Documents (PDF format)**
   - License agreements
   - Purchase receipts
   - Terms of Service acceptance screenshots
   - Written permissions from copyright holders

3. **Upload via Resolution Center**
   - Attach PDFs
   - Write clear explanation
   - Submit response

4. **Wait for Review**
   - No new binary upload needed (if only documentation issue)
   - Legal team reviews documents
   - Typically resolved in 1-3 business days

---

## ✅ Pre-Submission Checklist

### Before Clicking "Submit for Review":

**General App Information:**
- [ ] Copyright field filled: `© 2025 PrivyCalc. All rights reserved.`
- [ ] Privacy Policy URL: `https://privycalc.com/privacy`
- [ ] Terms of Use URL: `https://privycalc.com/terms`
- [ ] Support URL: `https://privycalc.com/help`

**Content Rights Question:**
- [ ] Decided on answer (YES/NO)
- [ ] If YES: License documentation ready
- [ ] If YES: Attribution added to app (if required)
- [ ] If YES: Prepared for potential documentation request

**Other Submission Questions:**
- [ ] Export Compliance (most apps: NO)
- [ ] Advertising Identifier (if using ads: YES, if not: NO)

---

## 💡 Best Practices

### ✅ DO:
- Be honest about content usage
- Keep all licenses and receipts
- Add Credits/Attribution section in app
- Follow brand guidelines for third-party logos
- Review API Terms of Service before using

### ❌ DON'T:
- Use copyrighted images without license
- Claim content as yours if it's not
- Upload without keeping documentation ready
- Forget to attribute when required

---

## 📖 Quick Reference Table

| **Your Content** | **Third-Party?** | **Answer** | **Documentation Needed?** |
|------------------|------------------|------------|---------------------------|
| User messages | NO | NO | None |
| User photos/videos | NO | NO | None |
| Your app UI/design | NO | NO | None |
| Open-source icons in code (MIT) | NO | NO | None |
| Stock screenshots (Unsplash) | YES | YES | License terms |
| Brand logos (proper use) | YES | YES | Brand guidelines |
| Licensed icon pack | YES | YES | License receipt |
| External API data | YES | YES | API ToS |

---

## 🎯 Recommended for Calculator+ Version 1.0

### **Answer During Submission:**

✅ **Content Rights: NO**

**Why:**
- All content is created by you or by users
- No third-party content displayed in the app
- Open-source libraries (MIT licensed) integrated as code, not displayed content
- User-generated content is not "third-party"

### **If Using Stock Photos in Screenshots Later:**

⚠️ **Change to: YES**

**And prepare:**
- Screenshot of Unsplash/Pexels license
- Add attribution in app Settings → About
- Keep license terms URL ready

---

## 📞 If You Get Stuck

### Resolution Center Response Template

```
Dear Apple Review Team,

Thank you for your question regarding content rights in Calculator+.

[Explain your situation clearly]

For example:
"Calculator+ displays only user-generated content (messages, photos, 
and videos created and shared by users themselves). We do not display, 
access, or contain any third-party copyrighted content.

The app's user interface, graphics, and design are all created by our 
company and we hold full copyright to these materials."

OR (if using licensed content):

"The stock photos visible in our App Store screenshots are licensed 
from Unsplash under their free license (unsplash.com/license). 
Please find attached:
1. Screenshot of license terms
2. Download confirmation
3. Attribution in our app (Settings → About → Credits)

All other content in the app is user-generated or created by us."

Please let me know if you need any additional information.

Best regards,
[Your Name]
PrivyCalc Team
```

---

## 🔗 Additional Resources

**Apple Documentation:**
- [App Information Guidelines](https://developer.apple.com/help/app-store-connect/reference/app-information/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

**Stock Photo Licenses:**
- [Unsplash License](https://unsplash.com/license)
- [Pexels License](https://pexels.com/license)

**Icon Libraries:**
- [Lucide Icons License](https://lucide.dev/license) - MIT License
- [SF Symbols License](https://developer.apple.com/sf-symbols/) - Free for iOS apps

---

## 📝 Summary

**For PrivyCalc Calculator+ App:**

1. ✅ **Answer: NO** to Content Rights (unless using stock photos in screenshots)
2. ✅ **Fill Copyright field:** `© 2025 PrivyCalc. All rights reserved.`
3. ✅ **Keep it simple:** User content is not third-party content
4. ✅ **Be prepared:** If you add licensed content later, have documentation ready

**The content rights question is not a blocker.** Answering honestly ensures smooth review and protects you if copyright issues arise later.

---

*Document Version: 1.0*  
*Last Updated: October 31, 2025*  
*For questions: support@privycalc.com*
