// ═══════════════════════════════════════════════════════════════
//  چینی داتا — Firestore (هەمان شێوەی داتای وەشانی offline دەگەڕێنێتەوە)
// ═══════════════════════════════════════════════════════════════
/* global firebase, firebaseConfig */

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const fdb = firebase.firestore();

// دۆخی ئێستای بەکارهێنەر
let CURRENT_USER = null;

function statusOf(amount, paid) {
  if (paid <= 0) return "نەدراوە";
  if (paid < amount) return "بەشێک دراوە";
  return "تەواو دراوە";
}

const DB = {
  // ---------------- Auth ----------------
  onAuth(cb) { auth.onAuthStateChanged(cb); },

  async login(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async logout() { await auth.signOut(); },

  // وەرگرتنی زانیاری بەکارهێنەر (ڕۆڵ) لە users/{uid}
  async loadProfile(uid) {
    const doc = await fdb.collection("users").doc(uid).get();
    if (!doc.exists) {
      // بەکارهێنەری نوێ — بنەڕەت user
      return { id: uid, full_name: "", role: "user", active: true };
    }
    return { id: uid, ...doc.data() };
  },

  // ---------------- Customers ----------------
  async customers(q = "") {
    const snap = await fdb.collection("customers").orderBy("name").get();
    let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((c) =>
        (c.name || "").toLowerCase().includes(s) ||
        (c.phone || "").includes(q));
    }
    // کۆکردنەوەی قەرز و پارەدانەوە بۆ هەر کڕیارێک
    const [debtsSnap, paySnap] = await Promise.all([
      fdb.collection("debts").get(),
      fdb.collection("payments").get(),
    ]);
    const debtByCust = {}, paidByCust = {};
    debtsSnap.forEach((d) => {
      const x = d.data();
      debtByCust[x.customerId] = (debtByCust[x.customerId] || 0) + (x.amount || 0);
    });
    paySnap.forEach((p) => {
      const x = p.data();
      paidByCust[x.customerId] = (paidByCust[x.customerId] || 0) + (x.amount || 0);
    });
    return list.map((c) => {
      const total_debt = debtByCust[c.id] || 0;
      const total_paid = paidByCust[c.id] || 0;
      return { ...c, total_debt, total_paid, remaining: total_debt - total_paid };
    });
  },

  async addCustomer(data) {
    const ref = await fdb.collection("customers").add({
      name: data.name.trim(),
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async updateCustomer(id, data) {
    await fdb.collection("customers").doc(id).update({
      name: data.name.trim(),
      phone: data.phone || null,
      address: data.address || null,
      notes: data.notes || null,
    });
    // نوێکردنەوەی ناوی کڕیار لە قەرزەکانیدا (denormalized)
    const debts = await fdb.collection("debts").where("customerId", "==", id).get();
    const batch = fdb.batch();
    debts.forEach((d) => batch.update(d.ref, { customerName: data.name.trim() }));
    await batch.commit();
  },

  async deleteCustomer(id) {
    // سڕینەوەی کڕیار + قەرز + پارەدانەوەکانی
    const [debts, pays] = await Promise.all([
      fdb.collection("debts").where("customerId", "==", id).get(),
      fdb.collection("payments").where("customerId", "==", id).get(),
    ]);
    const batch = fdb.batch();
    debts.forEach((d) => batch.delete(d.ref));
    pays.forEach((p) => batch.delete(p.ref));
    batch.delete(fdb.collection("customers").doc(id));
    await batch.commit();
  },

  // ووردەکاری کڕیار: کۆی گشتی + قەرزەکان + پارەدانەوەکان
  async customerDetail(id) {
    const [cDoc, dSnap, pSnap] = await Promise.all([
      fdb.collection("customers").doc(id).get(),
      fdb.collection("debts").where("customerId", "==", id).get(),
      fdb.collection("payments").where("customerId", "==", id).get(),
    ]);
    const customer = { id: cDoc.id, ...cDoc.data() };
    const paidByDebt = {};
    pSnap.forEach((p) => {
      const x = p.data();
      paidByDebt[x.debtId] = (paidByDebt[x.debtId] || 0) + (x.amount || 0);
    });
    let debts = dSnap.docs.map((d) => {
      const x = d.data();
      const paid = paidByDebt[d.id] || 0;
      return { id: d.id, ...x, paid, remaining: (x.amount || 0) - paid, status: statusOf(x.amount || 0, paid) };
    });
    debts.sort((a, b) => (a.date < b.date ? 1 : -1));
    let payments = pSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
    payments.sort((a, b) => (a.date < b.date ? 1 : -1));
    const total_debt = debts.reduce((s, d) => s + (d.amount || 0), 0);
    const total_paid = debts.reduce((s, d) => s + d.paid, 0);
    return { customer, total_debt, total_paid, remaining: total_debt - total_paid, debts, payments };
  },

  // ---------------- Debts ----------------
  async addDebt(data) {
    const cust = await fdb.collection("customers").doc(data.customerId).get();
    await fdb.collection("debts").add({
      customerId: data.customerId,
      customerName: cust.exists ? cust.data().name : "",
      date: data.date,
      subject: data.subject || null,
      amount: Number(data.amount),
      notes: data.notes || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  async updateDebt(id, data) {
    await fdb.collection("debts").doc(id).update({
      date: data.date,
      subject: data.subject || null,
      amount: Number(data.amount),
      notes: data.notes || null,
    });
  },

  async deleteDebt(id) {
    const pays = await fdb.collection("payments").where("debtId", "==", id).get();
    const batch = fdb.batch();
    pays.forEach((p) => batch.delete(p.ref));
    batch.delete(fdb.collection("debts").doc(id));
    await batch.commit();
  },

  // پارەدانەوە بۆ کۆی قەرز — بەسەر قەرزەکاندا دابەش دەکرێت (کۆنترین یەکەم)
  async payCustomer(customerId, data) {
    let left = Number(data.amount);
    const detail = await DB.customerDetail(customerId);
    if (left > detail.remaining + 0.001) {
      throw new Error(`بڕی پارەدانەوە لە کۆی قەرزی ماوە (${detail.remaining.toLocaleString()}) زیاترە`);
    }
    const debts = detail.debts.filter((d) => d.remaining > 0).sort((a, b) => (a.date > b.date ? 1 : -1));
    const batch = fdb.batch();
    for (const d of debts) {
      if (left <= 0.001) break;
      const pay = Math.min(d.remaining, left);
      const ref = fdb.collection("payments").doc();
      batch.set(ref, {
        debtId: d.id, customerId, date: data.date, amount: pay,
        notes: data.notes || null, debtSubject: d.subject || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      left -= pay;
    }
    await batch.commit();
  },

  async deletePayment(id) {
    await fdb.collection("payments").doc(id).delete();
  },

  // ---------------- Dashboard ----------------
  async dashboard() {
    const [dSnap, pSnap, cSnap] = await Promise.all([
      fdb.collection("debts").get(),
      fdb.collection("payments").get(),
      fdb.collection("customers").get(),
    ]);
    let total_debt = 0, total_paid = 0, today_debt = 0;
    const today = new Date().toISOString().slice(0, 10);
    const monthMap = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = { month: key, debt: 0, paid: 0 };
    }
    dSnap.forEach((d) => {
      const x = d.data();
      total_debt += x.amount || 0;
      if (x.date === today) today_debt += x.amount || 0;
      const k = (x.date || "").slice(0, 7);
      if (monthMap[k]) monthMap[k].debt += x.amount || 0;
    });
    pSnap.forEach((p) => {
      const x = p.data();
      total_paid += x.amount || 0;
      const k = (x.date || "").slice(0, 7);
      if (monthMap[k]) monthMap[k].paid += x.amount || 0;
    });
    return {
      total_debt, total_paid, remaining: total_debt - total_paid,
      customers: cSnap.size, today_debt,
      monthly: Object.values(monthMap),
    };
  },

  // ---------------- Reports ----------------
  async report(period) {
    const now = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    let from, to = iso(now);
    if (period === "daily") from = iso(now);
    else if (period === "weekly") { const d = new Date(now); d.setDate(d.getDate() - 6); from = iso(d); }
    else if (period === "monthly") from = iso(new Date(now.getFullYear(), now.getMonth(), 1));
    else if (period === "yearly") from = iso(new Date(now.getFullYear(), 0, 1));
    else from = iso(now);

    const [dSnap, pSnap] = await Promise.all([
      fdb.collection("debts").get(),
      fdb.collection("payments").get(),
    ]);
    const paidByDebt = {};
    pSnap.forEach((p) => { const x = p.data(); paidByDebt[x.debtId] = (paidByDebt[x.debtId] || 0) + (x.amount || 0); });
    let items = dSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((x) => x.date >= from && x.date <= to)
      .map((x) => {
        const paid = paidByDebt[x.id] || 0;
        return {
          date: x.date, customer_name: x.customerName, subject: x.subject,
          amount: x.amount || 0, paid, remaining: (x.amount || 0) - paid,
          status: statusOf(x.amount || 0, paid),
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const total_debt = items.reduce((s, i) => s + i.amount, 0);
    const total_paid = items.reduce((s, i) => s + i.paid, 0);
    return { period, date_from: from, date_to: to, total_debt, total_paid, remaining: total_debt - total_paid, items };
  },

  // ---------------- Users (admin) ----------------
  async users() {
    const snap = await fdb.collection("users").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async saveUser(uid, data) {
    await fdb.collection("users").doc(uid).set({
      full_name: data.full_name || null,
      role: data.role === "admin" ? "admin" : "user",
      active: data.active !== false,
    }, { merge: true });
  },

  // دروستکردنی بەکارهێنەری نوێ (بە app دووەم تا بەڕێوەبەر لە ژوورەوە بمێنێتەوە)
  async createUser(email, password, fullName, role) {
    const secondary = firebase.apps.find((a) => a.name === "secondary")
      || firebase.initializeApp(firebaseConfig, "secondary");
    try {
      const cred = await secondary.auth().createUserWithEmailAndPassword(email, password);
      await fdb.collection("users").doc(cred.user.uid).set({
        email, full_name: fullName || null,
        role: role === "admin" ? "admin" : "user", active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await secondary.auth().signOut();
      return cred.user.uid;
    } finally {
      // app دووەم دەمێنێتەوە بۆ جاری داهاتوو
    }
  },

  async deleteUserDoc(uid) {
    // تەنها دۆکیومێنتی ڕۆڵ دەسڕدرێتەوە (هەژماری Auth بە Console دەسڕدرێتەوە)
    await fdb.collection("users").doc(uid).delete();
  },

  // ---------------- پاڵپشت (Backup) ----------------
  // داگرتنی هەموو داتاکان (کڕیار، قەرز، پارەدانەوە)
  async exportData() {
    const [customers, debts, payments] = await Promise.all([
      fdb.collection("customers").get(),
      fdb.collection("debts").get(),
      fdb.collection("payments").get(),
    ]);
    const strip = (d) => {
      const o = { id: d.id, ...d.data() };
      // بەرواری سێرڤەر (Timestamp) دەکەینە دەق
      if (o.createdAt && o.createdAt.toDate) o.createdAt = o.createdAt.toDate().toISOString();
      return o;
    };
    return {
      app: "qarz-online",
      version: 1,
      exported_at: new Date().toISOString(),
      customers: customers.docs.map(strip),
      debts: debts.docs.map(strip),
      payments: payments.docs.map(strip),
    };
  },

  // گەڕاندنەوەی داتا لە فایلی پاڵپشتەوە (زیادکردن بەسەر داتای ئێستا)
  async importData(data) {
    if (!data || data.app !== "qarz-online") throw new Error("فایلی پاڵپشت دروست نییە");
    const sets = [
      ["customers", data.customers || []],
      ["debts", data.debts || []],
      ["payments", data.payments || []],
    ];
    let count = 0;
    for (const [coll, items] of sets) {
      // بە کۆمەڵ (batch) — هەر ٤٠٠ دۆکیومێنت
      for (let i = 0; i < items.length; i += 400) {
        const batch = fdb.batch();
        items.slice(i, i + 400).forEach((it) => {
          const { id, ...rest } = it;
          if (rest.createdAt && typeof rest.createdAt === "string") {
            rest.createdAt = firebase.firestore.Timestamp.fromDate(new Date(rest.createdAt));
          }
          const ref = id ? fdb.collection(coll).doc(id) : fdb.collection(coll).doc();
          batch.set(ref, rest, { merge: true });
          count++;
        });
        await batch.commit();
      }
    }
    return count;
  },
};
