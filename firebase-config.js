// ═══════════════════════════════════════════════════════════════
//  ڕێکخستنی Firebase — پرۆژەی bahand-qarz
// ═══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDnkLYArz8oCCQh7IhMRZQNQOHV1AeyMeE",
  authDomain: "bahand-qarz.firebaseapp.com",
  projectId: "bahand-qarz",
  storageBucket: "bahand-qarz.firebasestorage.app",
  messagingSenderId: "101999974583",
  appId: "1:101999974583:web:39f4746b75857db52d5532",
};

// ناوی دوکان (لەسەر پسوڵە دەردەکەوێت)
const STORE_NAME = "مارکێتی بەهەند";

// دامەزراندن
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const fdb = firebase.firestore();
