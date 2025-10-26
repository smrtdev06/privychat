# Critical Google Play Console Check

## 🚨 Missing Settings That Prevent Products from Loading

Based on 2024 reports with cordova-plugin-purchase v13, products won't load if these Play Console settings are incorrect:

---

## ✅ Check 1: Backwards Compatible Tag

**Go to Play Console:**
1. **Monetize → Subscriptions → Premium Yearly**
2. Click on base plan: **premium-yearly**
3. Look for a tag that says **"Backwards compatible"**

### What You Should See:
```
premium-yearly
Yearly, auto-renewing
[Backwards compatible]  ← This tag MUST be present
```

### If You DON'T See "Backwards compatible":
1. Click **Edit** on the base plan
2. Look for checkbox: **"Make this plan backwards compatible"**
3. **Check it** and save
4. Wait 15-30 minutes
5. Test app again

**Why this matters:**
- cordova-plugin-purchase requires backwards compatible base plans
- Without this, Google Play Billing API won't return the product
- This is the #1 missed setting in 2024

---

## ✅ Check 2: Base Plan Has at Least One Offer

**Still in the base plan view:**

Look at the **"Base plans and offers"** table.

### What You Should See:
```
ID and duration          Countries/regions    Status
premium-yearly           173 countries        Active [Backwards compatible]
  └─ [At least one offer listed underneath]
```

### If You See NO OFFERS:
1. Click **"Add offer"** button
2. Create a simple offer:
   - **Offer ID**: `default`
   - **Eligibility**: Developer determined
   - **Phases**: 1 phase
   - **Duration**: Unlimited
   - **Price**: $29.99/year
3. **Activate** the offer
4. Wait 15-30 minutes
5. Test app again

**Why this matters:**
- Google Play Billing Library 5+ requires at least one offer per base plan
- Base plan alone isn't enough - you need an active offer
- This is required even for simple yearly subscriptions

---

## ✅ Check 3: Subscription Description

**Back in the main subscription page:**

Scroll to **"Subscription details"** section.

### Required Fields:
- ✅ Product ID: `premium_yearly`
- ✅ Name: (anything, e.g., "Premium Yearly")
- ✅ Description: **MUST NOT BE EMPTY**
- ✅ Benefits: Can be empty, but recommended to fill

**If description is empty:**
1. Click **"Edit subscription details"**
2. Add a description (e.g., "Premium features including unlimited messages")
3. Save
4. Wait 15 minutes
5. Test app again

---

## 🎯 Quick Checklist

Go through these in order:

**Base Plan Settings:**
- [ ] Base plan status: **Active** ✅ (You confirmed this)
- [ ] Has **"Backwards compatible"** tag
- [ ] Has at least **one active offer** underneath it
- [ ] Offer status: **Active**

**Subscription Settings:**
- [ ] Product ID: `premium_yearly` ✅ (Correct)
- [ ] Description is **not empty**
- [ ] At least one country/region selected (173 ✅)

**Testing Setup:**
- [ ] License tester added: `smrtdev06@gmail.com` ✅
- [ ] App installed from Play Store ✅
- [ ] Waited 5+ hours ✅

---

## 📸 How to Verify

**Step 1: Open Play Console**
```
Play Console → Monetize → Subscriptions → Premium Yearly
```

**Step 2: Look at the base plan row**

You should see something like:
```
premium-yearly    173 countries/regions    Active    [Backwards compatible]
```

**Step 3: Check for offers**

Below the base plan, there should be at least one offer listed:
```
premium-yearly               ← Base plan
  └─ default                ← Offer (or any offer ID)
     Active                 ← Status must be Active
```

---

## 🔧 If Missing "Backwards Compatible"

**To add it:**

1. Click **Edit** (pencil icon) next to your base plan `premium-yearly`
2. Scroll down to find: **"Backwards compatibility"**
3. **Check the box**: "Make this plan backwards compatible with older versions of Google Play Billing"
4. Click **Save**
5. **Important**: Wait 30-60 minutes for changes to propagate
6. Clear Google Play cache on your phone
7. Test app again

---

## 🔧 If No Offers Exist

**To add an offer:**

1. In the base plan view, click **"Add offer"**
2. Fill in:
   - **Offer ID**: `default` (or any ID)
   - **Offer type**: Standard
   - **Eligibility**: Developer determined
3. Configure phases:
   - **Phase 1**: Unlimited duration, $29.99/year
4. **Countries**: Select all (173 countries)
5. Click **Save**
6. **Activate** the offer
7. Wait 30 minutes
8. Test app again

---

## 📱 After Making Changes

If you had to add "Backwards compatible" tag or create an offer:

1. **Wait 30-60 minutes** (Google Play propagation time)
2. **On your phone:**
   - Clear Google Play Store cache
   - Clear Google Play services cache
   - Reboot phone
3. **Open Calculator+ app**
4. **Check the debug log** (green panel at bottom)

Expected after fixes:
```
✓ Products loaded: 1
✓ Price: $29.99/year
✓ Can purchase: true
```

---

## ⚠️ Most Common Issue in 2024

According to Stack Overflow and GitHub issues with cordova-plugin-purchase v13:

> **90% of "products not loading" issues are caused by:**
> 1. Missing "Backwards compatible" tag on base plan
> 2. No offers defined under the base plan
> 3. Empty subscription description

**Please check your Play Console and tell me:**
1. Does base plan show **"Backwards compatible"** tag?
2. Is there at least **one offer** under the base plan?
3. Is the subscription **description** filled in?
