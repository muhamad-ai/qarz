# 🌐 قەرزی کڕیار — وەشانی ئۆنلاین (Firebase)

سیستەمی بەڕێوەبردنی قەرزی کڕیار، ئۆنلاین و چەند بەکارهێنەر، بە **Firebase + Firestore**.
کاردەکات لەسەر **کۆمپیوتەر، Android، و iPhone** — هەموو ئامێرەکان هەمان داتا دەبینن بە شێوەی ڕاستەوخۆ.

---

## 🔧 دامەزراندنی Firebase (یەک جار)

### ١. دروستکردنی پرۆژە
1. بڕۆ بۆ [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → ناوێک بنووسە (وەک `bahand-qarz`) → دروستی بکە.

### ٢. چالاککردنی Authentication
1. لە لای چەپ: **Build → Authentication → Get started**
2. **Sign-in method → Email/Password → Enable → Save**

### ٣. دروستکردنی Firestore
1. **Build → Firestore Database → Create database**
2. **Start in production mode** → Next → ناوچەیەک هەڵبژێرە (وەک `eur3`) → Enable.

### ٤. دانانی ڕێسا ئاسایشییەکان (Rules)
1. لە Firestore → **Rules**
2. ناوەڕۆکی فایلی **`firestore.rules`** کۆپی بکە و لەوێ دایبنێ → **Publish**.

### ٥. وەرگرتنی ڕێکخستنەکان (Config)
1. **Project settings** (⚙️) → **General** → **Your apps** → **Web** (`</>`)
2. ناوێک بنووسە → **Register app**
3. ئەو `firebaseConfig`ـەی پیشانت دەدات، کۆپی بکە.
4. بیکەرەوە لە فایلی **`firebase-config.js`** و شوێنی نموونەکان دابنێ.

### ٦. دروستکردنی یەکەم بەڕێوەبەر (Admin)
1. **Authentication → Users → Add user** → ئیمەیل و وشەی نهێنی بنووسە → Add.
2. ئەو بەکارهێنەرە **UID**ـەکەی کۆپی بکە.
3. بڕۆ بۆ **Firestore → Start collection** → ناوی `users` → Document ID = ئەو UIDـە → ئەم خانانە زیاد بکە:
   - `full_name` (string): ناوی خۆت
   - `role` (string): **`admin`**
   - `active` (boolean): **`true`**
4. Save.

ئێستا دەتوانیت بەو ئیمەیل/وشەی نهێنییە بچیتە ژوورەوە. دوای ئەوە، بەکارهێنەری تر لە ناو ئەپەکەوە زیاد دەکەیت.

---

## 🚀 بڵاوکردنەوە (Deploy)

هەمان ڕێگای IMSی Dukan — بە **GitHub Pages**:
1. پرۆژەکە بخە ناو GitHub repository.
2. **Settings → Pages → Branch: main → Save**.
3. لینکەکەت وەردەگریت (وەک `https://YOURNAME.github.io/qarz`).
4. لینکەکە لە هەر ئامێرێک بکەرەوە.

> ⚠️ لە Firebase Console → Authentication → **Settings → Authorized domains**،
> دۆمەینی GitHub Pages زیاد بکە (`YOURNAME.github.io`).

---

## 📱 دامەزراندن لەسەر ئامێرەکان

- **کۆمپیوتەر:** لینکەکە لە Chrome/Edge بکەرەوە. بۆ دامەزراندن وەک ئەپ: ئایکۆنی «Install» لە شریتی ناونیشان.
- **iPhone:** لە Safari بیکەرەوە → **Share → Add to Home Screen**.
- **Android:** لە Chrome بیکەرەوە → **Add to Home Screen**. یاخود APKـی ڕاستەقینە (بڕوانە خوارەوە).

---

## 🤖 دروستکردنی APKی Android (دواتر)

بە **Capacitor** دەکرێت بکرێتە APK. ئەم هەنگاوانە دواتر پێکەوە دەیکەین:
```
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "قەرزی کڕیار" com.itgate.qarz --web-dir=.
npx cap add android
npx cap sync
npx cap open android   # لە Android Studio ـدا build بکە
```

---

## ✨ تایبەتمەندییەکان
داشبۆرد، کڕیار، قەرزی کڕیار (کارت + کۆی گشتی)، کشف حساب (باڵانسی گەڕۆک)،
پارەدانەوە بۆ کۆی قەرز، ڕاپۆرت (ڕۆژانە/هەفتانە/مانگانە/ساڵانە) + Excel/PDF،
چاپی پسوڵە، ڕۆڵەکان (بەڕێوەبەر/بەکارهێنەر)، ڕاستەوخۆ (real-time) لەسەر هەموو ئامێرەکان.

---
*ITGate co — وەشانی ئۆنلاین ١.٠*
