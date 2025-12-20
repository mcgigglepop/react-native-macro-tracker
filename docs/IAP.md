

# The highest-revenue setup (best practice)

## 1️⃣ Use Apple In-App Subscriptions (non-negotiable)

Use **auto-renewing subscriptions** via StoreKit / Expo IAP.

**Best structure:**

* Monthly subscription
* Yearly subscription (discounted)
* Optional lifetime (high price anchor)

Why:

* Apple handles tax, fraud, refunds
* Users trust Apple billing
* Higher conversion than Stripe inside iOS apps

---

## 2️⃣ Price anchoring that maximizes revenue 💰

### Recommended pricing for calorie apps

(**Backed by what wins on the App Store**)

| Plan                | Price             | Why                          |
| ------------------- | ----------------- | ---------------------------- |
| Monthly             | **$9.99**         | High ARPU, impulsive         |
| Yearly              | **$59.99–$69.99** | Best LTV, looks like a deal  |
| Lifetime (optional) | **$149–199**      | Cash up front, anchor effect |

**Psychology**

* Most users *buy yearly*
* Monthly exists to make yearly feel cheap
* Lifetime converts power users & reduces churn anxiety

> If you only add one thing: **yearly plan with ~40% discount**

---

## 3️⃣ Freemium that *forces* upgrade (without anger)

The mistake most calorie apps make:
👉 they give too much for free.

### What should be FREE

* Manual calorie logging
* Basic daily totals
* Limited history (e.g. last 7 days)

### What should be PAID (high perceived value)

* Macro targets (protein/carbs/fat)
* Progress charts & trends
* Saved meals / templates
* AI insights (“why your weight stalled”)
* Export data
* Cloud sync across devices

This creates a **hard ceiling** where serious users *must* subscribe.

---

## 4️⃣ Reduce churn (this is where real money is made)

Apple pays you **more after 12 months**, so retention is everything.

### Retention tactics that actually work

* **Weekly progress email/push**
* Streaks (logging streak, protein streak)
* “You’re 82% to your goal” indicators
* Remind users *what they paid for*

Churn reduction beats acquisition every time.

---

## 6️⃣ Tech stack (Expo-friendly)

**Inside app**

* Expo IAP (StoreKit 2 under the hood)
* Apple auto-renew subscriptions
* Receipt validation via your backend (recommended)

**Backend**

* Store subscription status (entitlement-based)
* Trust Apple receipts as source of truth
* Do NOT manage billing logic yourself

---

## 7️⃣ Revenue math (realistic example)

Let’s say:

* $9.99/month
* 3% conversion rate
* 10,000 MAU

**Monthly revenue**

```
300 subscribers × $9.99 = ~$3,000/mo
```

Push yearly plans:

```
150 yearly subs × $59.99 = ~$9,000 upfront
```

With retention:

* After year 1 → Apple cut drops to 15%
* Margins increase automatically

This is how apps quietly scale to **$30k–$100k MRR**.

---

# TL;DR – Best possible setup

✅ Apple In-App auto-renewing subscriptions
✅ Monthly + discounted yearly (plus optional lifetime)
✅ Aggressive but fair freemium wall
✅ Retention > acquisition
✅ Upsell coaching/services off-app


