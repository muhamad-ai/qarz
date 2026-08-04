// ================================================================
//  سیستەمی قەرزی کڕیار — لۆجیکی سەرەکی
// ================================================================

/* ---------------- یارمەتیدەرەکان ---------------- */
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const money = (n) => fmt(n) + " د.ع";
const todayISO = () => new Date().toISOString().slice(0, 10);
const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));

/* ناوی دوکان — لێرە بیگۆڕە بۆ ناوی خۆت */
const STORE_NAME = "مارکێتی بەهەند";

/* لۆگۆی پسوڵە (SVG — باش لەسەر پرینتەری فێرمی دەردەکەوێت) */
const STORE_LOGO = `<svg viewBox="0 0 64 64" width="48" height="48" style="display:block;margin:0 auto 4px">
  <path d="M8 23 L13 9 H51 L56 23 Z" fill="#000"/>
  <rect x="12" y="23" width="40" height="32" fill="none" stroke="#000" stroke-width="3"/>
  <rect x="25" y="35" width="14" height="20" fill="#000"/>
  <rect x="16" y="28" width="7" height="6" fill="#000"/>
  <rect x="41" y="28" width="7" height="6" fill="#000"/>
</svg>`;

/* CSSی لۆگۆ (بۆ ناو خانەی <style>ی پسوڵە) */
const LOGO_CSS = `
  .rhead{text-align:center;margin-bottom:4px}
  .rstore{font-size:20px;font-weight:800;letter-spacing:.5px}
  .rtag{font-size:10px;letter-spacing:3px;margin-top:2px}
  .rline{display:flex;align-items:center;gap:6px;margin:6px 0}
  .rline::before,.rline::after{content:"";flex:1;border-top:2px solid #000}
  .rline span{font-size:9.5px;font-weight:700;white-space:nowrap}`;

/* سەردێڕی پسوڵە لەگەڵ لۆگۆ */
function receiptHead(subtitle) {
  return `<div class="rhead">${STORE_LOGO}
    <div class="rstore">${esc(STORE_NAME)}</div>
    <div class="rtag">M A R K E T</div>
  </div>
  <div class="rline"><span>${esc(subtitle)}</span></div>`;
}

/* ---------------- چاپی وەسڵی پارەدانەوە (٨٠mm POS) ---------------- */
/* فۆنتی Vazirmatn وەک @font-face بەستراو (بۆ چاپ) */
let _fontFaceCache = null;
async function fontFace() {
  if (_fontFaceCache !== null) return _fontFaceCache;
  try {
    const res = await fetch("assets/fonts/Vazirmatn.woff2");
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
    _fontFaceCache = `@font-face{font-family:'Vazirmatn';src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2');}`;
  } catch (_) { _fontFaceCache = ""; }
  return _fontFaceCache;
}

const Receipt = {
  async print(pay, debt) {
    const now = new Date();
    const dt = now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const ff = await fontFace();
    const html = `<!DOCTYPE html><html lang="ckb" dir="rtl"><head><meta charset="UTF-8">
<title>وەسڵ</title><style>
${ff}
@page { margin: 0; }
* { box-sizing: border-box; }
body { width: 64mm; margin: 0 auto; padding: 4mm 0; font-family: "Vazirmatn","Segoe UI",Tahoma,sans-serif;
  color: #000; direction: rtl; font-size: 12px; line-height: 1.7; }
.center { text-align: center; }
.store { font-size: 17px; font-weight: 800; }
.sub { font-size: 11px; }
hr { border: none; border-top: 1px dashed #000; margin: 7px 0; }
.row { display: flex; justify-content: space-between; gap: 8px; }
.row .lbl { color: #000; }
.row .val { font-weight: 700; }
.big { font-size: 15px; font-weight: 800; }
.foot { margin-top: 8px; font-size: 11px; }
${LOGO_CSS}
</style></head><body>
  ${receiptHead("وەسڵی پارەدانەوەی قەرز")}
  <div class="row"><span class="lbl">بەروار:</span><span class="val">${esc(dt)}</span></div>
  <div class="row"><span class="lbl">کڕیار:</span><span class="val">${esc(debt.customer_name)}</span></div>
  ${debt.subject ? `<div class="row"><span class="lbl">بابەت:</span><span class="val">${esc(debt.subject)}</span></div>` : ""}
  <hr>
  <div class="row"><span class="lbl">کۆی قەرز:</span><span class="val">${money(debt.amount)}</span></div>
  <div class="row big"><span class="lbl">پارەی دراو ئێستا:</span><span class="val">${money(pay.amount)}</span></div>
  <hr>
  <div class="row"><span class="lbl">کۆی دراو:</span><span class="val">${money(debt.paid)}</span></div>
  <div class="row"><span class="lbl">پارەی ماوە:</span><span class="val">${money(debt.remaining)}</span></div>
  ${pay.notes ? `<hr><div class="sub">تێبینی: ${esc(pay.notes)}</div>` : ""}
  <hr>
  <div class="center foot">
    <div>کڕیار: <b>${esc(debt.customer_name)}</b></div>
    <div>بەروار: ${esc(dt)}</div>
    <div style="margin-top:6px">سوپاس بۆ متمانەتان 🌹<br>${esc(STORE_NAME)}</div>
  </div>
</body></html>`;
    printDoc(html);
  },
};

/* چاپکردن: لە وێبگەڕ بە دیالۆگی چاپ (کۆمپیوتەر: پرینتەری فێرمی هەڵبژێرە) */
async function printDoc(html) {
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) { toast("تکایە ڕێگە بە پەنجەرەی نوێ بدە بۆ چاپ", "err"); return; }
  const withScript = html.replace("</body></html>",
    `<script>function go(){window.print();setTimeout(function(){window.close();},400);}
     if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(go,150);});}else{window.onload=go;}<\/script></body></html>`);
  w.document.open(); w.document.write(withScript); w.document.close();
}

function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span class="ic">${type === "err" ? "⚠️" : "✅"}</span> ${esc(msg)}`;
  $("toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3200);
}

function openModal(id) { $(id).classList.add("show"); }
function closeModal(id) { $(id).classList.remove("show"); }

let _confirmCb = null;
function confirmDialog(text, cb, title = "دڵنیایت؟") {
  $("confirmTitle").textContent = title;
  $("confirmText").textContent = text;
  _confirmCb = cb;
  openModal("confirmModal");
}
$("confirmYes").addEventListener("click", () => {
  closeModal("confirmModal");
  if (_confirmCb) _confirmCb();
});

// داخستنی مۆداڵ بە کلیک لەسەر پشتەوە
document.querySelectorAll(".modal-overlay").forEach((ov) => {
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("show"); });
});

/* ---------------- بەشێوەی گشتی: سۆرت + پەیج ---------------- */
function sortData(data, key, dir) {
  const arr = [...data];
  arr.sort((a, b) => {
    let x = a[key], y = b[key];
    if (typeof x === "number" && typeof y === "number") return dir === "asc" ? x - y : y - x;
    x = (x ?? "").toString(); y = (y ?? "").toString();
    return dir === "asc" ? x.localeCompare(y, "ckb") : y.localeCompare(x, "ckb");
  });
  return arr;
}

function bindSort(tableId, state, render) {
  document.querySelectorAll(`#${tableId} thead th.sortable`).forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      else { state.sortKey = key; state.sortDir = "asc"; }
      document.querySelectorAll(`#${tableId} thead th`).forEach((t) => t.classList.remove("asc", "desc"));
      th.classList.add(state.sortDir);
      state.page = 1;
      render();
    });
  });
}

function renderPager(pagerId, total, state, render) {
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > pages) state.page = pages;
  const start = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const end = Math.min(total, state.page * state.pageSize);
  const p = $(pagerId);
  p.innerHTML = `
    <div class="info">پیشاندانی ${start}–${end} لە ${total}</div>
    <div class="controls">
      <button class="btn btn-ghost btn-sm" ${state.page <= 1 ? "disabled" : ""} data-act="prev">▶ پێشوو</button>
      <button class="btn btn-ghost btn-sm" ${state.page >= pages ? "disabled" : ""} data-act="next">دواتر ◀</button>
    </div>`;
  p.querySelector('[data-act="prev"]').onclick = () => { if (state.page > 1) { state.page--; render(); } };
  p.querySelector('[data-act="next"]').onclick = () => { if (state.page < pages) { state.page++; render(); } };
}

function statusPill(status) {
  const map = {
    "نەدراوە": "pill-danger",
    "بەشێک دراوە": "pill-warn",
    "تەواو دراوە": "pill-success",
  };
  return `<span class="pill ${map[status] || ""}">${status}</span>`;
}

/* ================================================================
   دەستپێک
   ================================================================ */
let CURRENT_USER = null;

function init() {
  // چاوەڕوانی دۆخی چوونەژوورەوەی Firebase
  DB.onAuth(async (user) => {
    if (!user) { location.href = "index.html"; return; }
    CURRENT_USER = await DB.loadProfile(user.uid);
    CURRENT_USER.email = user.email;
    if (!CURRENT_USER.full_name) CURRENT_USER.full_name = user.email;

    $("userName").textContent = CURRENT_USER.full_name;
    $("userRole").textContent = CURRENT_USER.role === "admin" ? "بەڕێوەبەر" : "بەکارهێنەر";
    $("userAvatar").textContent = (CURRENT_USER.full_name || "?")[0].toUpperCase();
    if (CURRENT_USER.role === "admin") document.body.classList.add("is-admin");

    $("app").classList.add("show");
    navigate("dashboard");
  });

  // نەڤیگەیشن
  $("nav").addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (!item) return;
    navigate(item.dataset.page);
    document.body.classList.remove("nav-open");
  });

  $("logoutBtn").addEventListener("click", async () => { await DB.logout(); location.href = "index.html"; });
}

function navigate(page) {
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.page === page));
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  $("page-" + page).classList.add("active");
  const loaders = {
    dashboard: Dashboard.load,
    customers: Customers.load,
    debts: Debts.load,
    reports: Reports.load,
    users: Users.load,
  };
  if (loaders[page]) loaders[page]();
}

/* ================================================================
   داشبۆرد
   ================================================================ */
let _chart = null;
const Dashboard = {
  async load() {
    try {
      const s = await DB.dashboard();
      const cards = [
        { c: "c-debt", e: "💰", label: "کۆی گشتی قەرز", val: money(s.total_debt) },
        { c: "c-paid", e: "💵", label: "کۆی پارەی وەرگیراو", val: money(s.total_paid) },
        { c: "c-remain", e: "⏳", label: "پارەی ماوە", val: money(s.remaining) },
        { c: "c-cust", e: "👤", label: "ژمارەی کڕیارەکان", val: fmt(s.customers) },
        { c: "c-today", e: "📅", label: "قەرزی ئەمڕۆ", val: money(s.today_debt) },
        { c: "c-month", e: "📈", label: "قەرزی ئەم مانگە", val: money(s.monthly.at(-1)?.debt || 0) },
      ];
      $("statGrid").innerHTML = cards.map((c) => `
        <div class="stat-card ${c.c}">
          <div class="emoji">${c.e}</div>
          <div class="label">${c.label}</div>
          <div class="value">${c.val}</div>
        </div>`).join("");
      Dashboard.chart(s.monthly);
    } catch (e) { toast(e.message, "err"); }
  },

  chart(monthly) {
    const ctx = $("monthlyChart");
    if (_chart) _chart.destroy();
    _chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: monthly.map((m) => m.month),
        datasets: [
          { label: "قەرز", data: monthly.map((m) => m.debt), backgroundColor: "#dc2626", borderRadius: 6, maxBarThickness: 26 },
          { label: "پارەدانەوە", data: monthly.map((m) => m.paid), backgroundColor: "#16a34a", borderRadius: 6, maxBarThickness: 26 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            rtl: true, titleFont: { family: "Vazirmatn" }, bodyFont: { family: "Vazirmatn" },
            callbacks: { label: (c) => c.dataset.label + ": " + money(c.raw) },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "Vazirmatn", size: 11 } } },
          y: { ticks: { font: { family: "Vazirmatn" }, callback: (v) => fmt(v) }, grid: { color: "#f1f5f9" } },
        },
      },
    });
  },
};

/* ================================================================
   کڕیارەکان
   ================================================================ */
const Customers = {
  data: [], state: { sortKey: "name", sortDir: "asc", page: 1, pageSize: 15 }, _bound: false,

  async load() {
    try {
      const q = $("custSearch").value.trim();
      Customers.data = await DB.customers(q);
      if (!Customers._bound) {
        bindSort("custTable", Customers.state, Customers.render);
        $("custSearch").addEventListener("input", debounce(() => Customers.load(), 300));
        Customers._bound = true;
      }
      Customers.render();
    } catch (e) { toast(e.message, "err"); }
  },

  render() {
    const st = Customers.state;
    const sorted = sortData(Customers.data, st.sortKey, st.sortDir);
    const slice = sorted.slice((st.page - 1) * st.pageSize, st.page * st.pageSize);
    const body = $("custBody");
    if (sorted.length === 0) {
      body.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="big">👤</div>هیچ کڕیارێک نییە</div></td></tr>`;
    } else {
      body.innerHTML = slice.map((c) => `
        <tr>
          <td class="name-cell"><b>${esc(c.name)}</b></td>
          <td class="num">${esc(c.phone) || "—"}</td>
          <td class="wrap">${esc(c.address) || "—"}</td>
          <td class="num">${money(c.total_debt)}</td>
          <td class="num" style="color:${c.remaining > 0 ? "var(--danger)" : "var(--success)"}">${money(c.remaining)}</td>
          <td class="wrap">${esc(c.notes) || "—"}</td>
          <td><div class="t-actions">
            <button class="btn-icon" title="دەستکاری" onclick='Customers.openForm(${JSON.stringify(c)})'>✏️</button>
            ${CURRENT_USER.role === "admin" ? `<button class="btn-icon danger" title="سڕینەوە" onclick="Customers.remove(${c.id}, '${esc(c.name)}')">🗑️</button>` : ""}
          </div></td>
        </tr>`).join("");
    }
    renderPager("custPager", sorted.length, st, Customers.render);
  },

  openForm(c = null) {
    $("custModalTitle").textContent = c ? "دەستکاریکردنی کڕیار" : "کڕیاری نوێ";
    $("custId").value = c?.id || "";
    $("custName").value = c?.name || "";
    $("custPhone").value = c?.phone || "";
    $("custAddress").value = c?.address || "";
    $("custNotes").value = c?.notes || "";
    openModal("custModal");
    setTimeout(() => $("custName").focus(), 100);
  },

  async save() {
    const name = $("custName").value.trim();
    if (!name) { toast("ناوی کڕیار پێویستە", "err"); return; }
    const body = {
      name, phone: $("custPhone").value.trim() || null,
      address: $("custAddress").value.trim() || null,
      notes: $("custNotes").value.trim() || null,
    };
    const id = $("custId").value;
    try {
      if (id) await DB.updateCustomer(id, body);
      else await DB.addCustomer(body);
      closeModal("custModal");
      toast(id ? "کڕیار نوێکرایەوە" : "کڕیار زیادکرا");
      Customers.load();
    } catch (e) { toast(e.message, "err"); }
  },

  remove(id, name) {
    confirmDialog(`سڕینەوەی کڕیار «${name}» هەموو قەرز و پارەدانەوەکانیشی دەسڕێتەوە. دڵنیایت؟`, async () => {
      try { await DB.deleteCustomer(id); toast("کڕیار سڕایەوە"); Customers.load(); }
      catch (e) { toast(e.message, "err"); }
    });
  },
};

/* ================================================================
   قەرزەکان
   ================================================================ */
const Debts = {
  data: [], customers: [],
  state: { sortKey: "date", sortDir: "desc", page: 1, pageSize: 15 }, _bound: false,

  async load() {
    try {
      const q = $("debtSearch").value.trim();
      Debts.data = await DB.customers(q);
      if (!Debts._bound) {
        $("debtSearch").addEventListener("input", debounce(() => Debts.load(), 300));
        $("debtStatus").addEventListener("change", () => Debts.render());
        Debts._bound = true;
      }
      Debts.render();
    } catch (e) { toast(e.message, "err"); }
  },

  custStatus(c) {
    if (c.total_debt <= 0) return null;              // بێ قەرز
    if (c.remaining <= 0) return "تەواو دراوە";
    if (c.total_paid > 0) return "بەشێک دراوە";
    return "نەدراوە";
  },

  render() {
    const st = Debts.state;
    const filter = $("debtStatus").value;
    let list = (Debts.data || []).map((c) => ({ ...c, _status: Debts.custStatus(c) }))
      .filter((c) => c._status !== null);              // تەنها ئەوانەی قەرزیان هەیە
    if (filter) list = list.filter((c) => c._status === filter);
    list.sort((a, b) => b.remaining - a.remaining);
    const slice = list.slice((st.page - 1) * st.pageSize, st.page * st.pageSize);
    const body = $("debtBody");
    if (list.length === 0) {
      body.innerHTML = `<div class="empty"><div class="big">🧾</div>هیچ قەرزێک نییە</div>`;
    } else {
      body.innerHTML = slice.map((c) => `
        <div class="rec-card cd-clickable" onclick="CustomerDebts.open(${c.id})">
          <div class="rc-head">
            <div class="rc-title">
              <span class="rc-name">${esc(c.name)}</span>
              ${c.phone ? `<span class="rc-date">📞 ${esc(c.phone)}</span>` : ""}
            </div>
            ${statusPill(c._status)}
          </div>
          <div class="rc-figures">
            <div class="fig"><span class="lbl">کۆی قەرز</span><span class="v">${money(c.total_debt)}</span></div>
            <div class="fig"><span class="lbl">دراو</span><span class="v ok">${money(c.total_paid)}</span></div>
            <div class="fig"><span class="lbl">ماوە</span><span class="v ${c.remaining > 0 ? "bad" : "ok"}">${money(c.remaining)}</span></div>
          </div>
          <div class="rc-open">کلیک بکە بۆ بینینی قەرزەکان و پارەدانەوە ◀</div>
        </div>`).join("");
    }
    renderPager("debtPager", list.length, st, Debts.render);
  },

  clearFilters() {
    $("debtSearch").value = ""; $("debtStatus").value = "";
    Debts.load();
  },

  async openForm(d = null) {
    // بارکردنی کڕیارەکان بۆ لیستەکە
    try { Debts.customers = await DB.customers(); }
    catch (e) { toast(e.message, "err"); return; }

    if (Debts.customers.length === 0) { toast("سەرەتا کڕیارێک زیاد بکە", "err"); navigate("customers"); return; }

    $("debtCustomer").innerHTML = Debts.customers
      .map((c) => `<option value="${c.id}">${esc(c.name)}${c.phone ? " — " + esc(c.phone) : ""}</option>`).join("");
    $("debtModalTitle").textContent = d ? "دەستکاریکردنی قەرز" : "قەرزی نوێ";
    $("debtId").value = d?.id || "";
    $("debtCustomer").value = d?.customer_id || Debts.customers[0].id;
    $("debtDate").value = d?.date || todayISO();
    $("debtAmount").value = d?.amount ?? "";
    $("debtSubject").value = d?.subject || "";
    // پێشنیاری بابەت تەنها لە بابەتەکانی پێشووی خۆت
    const subjects = [...new Set((Debts.data || []).map((x) => x.subject).filter(Boolean))];
    $("subjectList").innerHTML = subjects.map((s) => `<option value="${esc(s)}"></option>`).join("");
    $("debtNotes").value = d?.notes || "";
    openModal("debtModal");
  },

  async save() {
    const amount = parseFloat($("debtAmount").value);
    if (!$("debtDate").value) { toast("بەروار پێویستە", "err"); return; }
    if (isNaN(amount) || amount < 0) { toast("بڕی پارە دروست نییە", "err"); return; }
    const body = {
      customer_id: parseInt($("debtCustomer").value),
      date: $("debtDate").value,
      subject: $("debtSubject").value.trim() || null,
      amount,
      notes: $("debtNotes").value.trim() || null,
    };
    const id = $("debtId").value;
    try {
      if (id) await DB.updateDebt(id, body);
      else await DB.addDebt(body);
      closeModal("debtModal");
      toast(id ? "قەرز نوێکرایەوە" : "قەرز زیادکرا");
      Debts.load();
    } catch (e) { toast(e.message, "err"); }
  },

  remove(id) {
    confirmDialog("سڕینەوەی ئەم قەرزە هەموو پارەدانەوەکانیشی دەسڕێتەوە. دڵنیایت؟", async () => {
      try { await DB.deleteDebt(id); toast("قەرز سڕایەوە"); Debts.load(); }
      catch (e) { toast(e.message, "err"); }
    });
  },
};

/* ================================================================
   قەرزەکانی کڕیار (کۆی گشتی + پارەدانەوە)
   ================================================================ */
const CustomerDebts = {
  detail: null, _bound: false,

  async open(customerId) {
    try {
      CustomerDebts.detail = await DB.customerDetail(customerId);
      $("cdPayDate").value = todayISO();
      $("cdPayAmount").value = "";
      $("cdPayNotes").value = "";
      CustomerDebts.render();
      openModal("custDebtsModal");
    } catch (e) { toast(e.message, "err"); }
  },

  entries() {
    const d = CustomerDebts.detail;
    const list = [];
    d.debts.forEach((x) => list.push({ kind: "debt", id: x.id, date: x.date, subject: x.subject, amount: x.amount, raw: x }));
    d.payments.forEach((p) => list.push({ kind: "payment", id: p.id, date: p.payment_date, subject: p.debt_subject, amount: p.amount, notes: p.notes }));
    // ڕیزکردن بەپێی بەروار (کۆنترین سەرەوە)، پاشان بەپێی جۆر (قەرز پێش پارەدانەوە)
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      if (a.kind !== b.kind) return a.kind === "debt" ? -1 : 1;
      return a.id - b.id;
    });
    let bal = 0;
    list.forEach((e) => { bal += e.kind === "debt" ? e.amount : -e.amount; e.balance = bal; });
    return list;
  },

  render() {
    const d = CustomerDebts.detail;
    $("cdTitle").textContent = "💳 کشف حسابی: " + d.customer.name;
    $("cdSummary").innerHTML = `
      <div class="cd-sum-card"><div class="l">کۆی قەرز</div><div class="v">${money(d.total_debt)}</div></div>
      <div class="cd-sum-card"><div class="l">کۆی دراو</div><div class="v ok">${money(d.total_paid)}</div></div>
      <div class="cd-sum-card"><div class="l">ماوە</div><div class="v ${d.remaining > 0 ? "bad" : "ok"}">${money(d.remaining)}</div></div>`;

    const rows = CustomerDebts.entries();
    const isAdmin = CURRENT_USER.role === "admin";
    $("cdStatement").innerHTML = rows.length === 0
      ? `<tr><td colspan="7"><div class="empty" style="padding:24px">هیچ تۆمارێک نییە</div></td></tr>`
      : rows.map((e) => `
        <tr class="${e.kind === "debt" ? "row-debt" : "row-pay"}">
          <td class="num">${esc(e.date)}</td>
          <td>${e.kind === "debt" ? "🛒 قەرز" : "💵 پارەدانەوە"}</td>
          <td>${esc(e.subject) || (e.kind === "payment" ? (esc(e.notes) || "—") : "—")}</td>
          <td class="num" style="color:var(--danger)">${e.kind === "debt" ? money(e.amount) : ""}</td>
          <td class="num" style="color:var(--success)">${e.kind === "payment" ? money(e.amount) : ""}</td>
          <td class="num"><b>${money(e.balance)}</b></td>
          <td><div class="t-actions">
            ${e.kind === "debt" ? `<button class="btn-icon" title="دەستکاری" onclick='CustomerDebts.editDebt(${JSON.stringify(e.raw)})'>✏️</button>` : ""}
            ${isAdmin ? `<button class="btn-icon danger" title="سڕینەوە" onclick="CustomerDebts.${e.kind === "debt" ? "removeDebt" : "removePayment"}(${e.id})">🗑️</button>` : ""}
          </div></td>
        </tr>`).join("");
  },

  async refresh() {
    CustomerDebts.detail = await DB.customerDetail(CustomerDebts.detail.customer.id);
    CustomerDebts.render();
    Debts.load();
  },

  async pay() {
    const amount = parseFloat($("cdPayAmount").value);
    if (!$("cdPayDate").value) { toast("بەروار پێویستە", "err"); return; }
    if (isNaN(amount) || amount <= 0) { toast("بڕی پارە دروست نییە", "err"); return; }
    const d = CustomerDebts.detail;
    try {
      await DB.payCustomer(d.customer.id, {
        date: $("cdPayDate").value, amount, notes: $("cdPayNotes").value.trim() || null,
      });
      toast("پارەدانەوە تۆمارکرا");
      const paidNow = amount;
      $("cdPayAmount").value = ""; $("cdPayNotes").value = "";
      await CustomerDebts.refresh();
      confirmDialog("پارەدانەوە تۆمارکرا. دەتەوێت وەسڵ چاپ بکەیت؟", () => {
        Receipt.print(
          { amount: paidNow, notes: null },
          { customer_name: CustomerDebts.detail.customer.name, subject: null,
            amount: CustomerDebts.detail.total_debt, paid: CustomerDebts.detail.total_paid,
            remaining: CustomerDebts.detail.remaining }
        );
      }, "چاپی وەسڵ");
    } catch (e) { toast(e.message, "err"); }
  },

  async editDebt(x) {
    closeModal("custDebtsModal");
    Debts.openForm(x);
  },

  removeDebt(id) {
    confirmDialog("سڕینەوەی ئەم قەرزە هەموو پارەدانەوەکانیشی دەسڕێتەوە. دڵنیایت؟", async () => {
      try { await DB.deleteDebt(id); toast("قەرز سڕایەوە"); await CustomerDebts.refresh(); }
      catch (e) { toast(e.message, "err"); }
    });
  },

  removePayment(id) {
    confirmDialog("سڕینەوەی ئەم پارەدانەوەیە؟", async () => {
      try { await DB.deletePayment(id); toast("پارەدانەوە سڕایەوە"); await CustomerDebts.refresh(); }
      catch (e) { toast(e.message, "err"); }
    });
  },

  async printStatement() {
    const d = CustomerDebts.detail;
    const rows = CustomerDebts.entries();
    const now = new Date();
    const dt = now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const ff = await fontFace();
    const body = rows.map((e) => `
      <tr>
        <td>${esc(e.date)}</td>
        <td>${e.kind === "debt" ? "قەرز" : "پارەدانەوە"}</td>
        <td>${esc(e.subject) || (e.notes ? esc(e.notes) : "—")}</td>
        <td class="n">${e.kind === "debt" ? money(e.amount) : ""}</td>
        <td class="n">${e.kind === "payment" ? money(e.amount) : ""}</td>
        <td class="n b">${money(e.balance)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="ckb" dir="rtl"><head><meta charset="UTF-8"><title>کشف حساب</title><style>
      ${ff}
      @page{margin:0;}
      *{box-sizing:border-box;font-family:"Vazirmatn",sans-serif;}
      body{width:64mm;margin:0 auto;padding:4mm 0;direction:rtl;color:#000;font-size:11px;line-height:1.6;}
      .center{text-align:center;}
      .store{font-size:16px;font-weight:800;}
      .sub{font-size:10px;}
      .info{margin:8px 0;font-size:11px;}
      .info div{display:flex;justify-content:space-between;gap:6px;}
      .info .val{font-weight:700;}
      hr{border:none;border-top:1px dashed #000;margin:6px 0;}
      table{width:100%;border-collapse:collapse;font-size:9.5px;table-layout:fixed;}
      th{border-bottom:1px solid #000;padding:3px 1px;text-align:center;font-weight:800;}
      td{padding:3px 1px;border-bottom:1px dotted #999;text-align:center;word-break:break-word;}
      td.n{font-weight:700;} td.b{font-weight:800;}
      .col-d{width:20%;} .col-t{width:16%;} .col-s{width:22%;} .col-n{width:14%;}
      .totals{margin-top:8px;font-size:12px;}
      .totals div{display:flex;justify-content:space-between;font-weight:700;}
      .big{font-size:14px;font-weight:800;}
      .foot{margin-top:10px;font-size:10px;}
      ${LOGO_CSS}
      </style></head><body>
      ${receiptHead("کشف حساب")}
      <div class="info">
        <div><span>کڕیار:</span><span class="val">${esc(d.customer.name)}</span></div>
        ${d.customer.phone ? `<div><span>مۆبایل:</span><span class="val">${esc(d.customer.phone)}</span></div>` : ""}
        <div><span>بەرواری چاپ:</span><span class="val">${esc(dt)}</span></div>
      </div>
      <table>
        <thead><tr><th class="col-d">بەروار</th><th class="col-t">جۆر</th><th class="col-s">بابەت</th><th class="col-n">قەرز</th><th class="col-n">دانەوە</th><th class="col-n">باڵانس</th></tr></thead>
        <tbody>${body || `<tr><td colspan="6">هیچ تۆمارێک نییە</td></tr>`}</tbody>
      </table>
      <hr>
      <div class="totals">
        <div><span>کۆی قەرز:</span><span>${money(d.total_debt)}</span></div>
        <div><span>کۆی دراو:</span><span>${money(d.total_paid)}</span></div>
        <div class="big"><span>ماوە:</span><span>${money(d.remaining)}</span></div>
      </div>
      <hr>
      <div class="center foot">سوپاس بۆ متمانەتان<br>${esc(STORE_NAME)}</div>
      </body></html>`;
    printDoc(html);
  },
};


/* ================================================================
   پارەدانەوەکان (بۆ قەرزێکی دیاریکراو)
   ================================================================ */
const Payments = {
  debt: null,

  async open(debtId) {
    try {
      Payments.debt = await API.get("/api/debts/" + debtId);
      $("payDate").value = todayISO();
      $("payAmount").value = "";
      $("payNotes").value = "";
      Payments.renderInfo();
      await Payments.loadList();
      openModal("payModal");
    } catch (e) { toast(e.message, "err"); }
  },

  renderInfo() {
    const d = Payments.debt;
    $("payDebtInfo").innerHTML = `
      <span class="ic">🧾</span>
      <div>
        <b>${esc(d.customer_name)}</b> — ${esc(d.subject) || "بێ بابەت"}<br>
        کۆی قەرز: <b>${money(d.amount)}</b> · دراوە: <b style="color:var(--success)">${money(d.paid)}</b> ·
        ماوە: <b style="color:var(--danger)">${money(d.remaining)}</b>
      </div>`;
  },

  async loadList() {
    const rows = await API.get("/api/debts/" + Payments.debt.id + "/payments");
    const body = $("payBody");
    if (rows.length === 0) {
      body.innerHTML = `<tr><td colspan="4"><div class="empty" style="padding:24px">هیچ پارەدانەوەیەک نییە</div></td></tr>`;
    } else {
      body.innerHTML = rows.map((p) => `
        <tr>
          <td class="num">${esc(p.payment_date)}</td>
          <td class="num" style="color:var(--success)">${money(p.amount)}</td>
          <td class="wrap">${esc(p.notes) || "—"}</td>
          <td><div class="t-actions">
            <button class="btn-icon" title="چاپی وەسڵ" onclick='Payments.printOne(${JSON.stringify(p)})'>🖨️</button>
            <button class="btn-icon danger" title="سڕینەوە" onclick="Payments.remove(${p.id})">🗑️</button>
          </div></td>
        </tr>`).join("");
    }
  },

  printOne(p) {
    Receipt.print({ amount: p.amount, notes: p.notes }, Payments.debt);
  },

  async add() {
    const amount = parseFloat($("payAmount").value);
    if (!$("payDate").value) { toast("بەروار پێویستە", "err"); return; }
    if (isNaN(amount) || amount <= 0) { toast("بڕی پارە دروست نییە", "err"); return; }
    try {
      await API.post("/api/payments", {
        debt_id: Payments.debt.id, payment_date: $("payDate").value,
        amount, notes: $("payNotes").value.trim() || null,
      });
      toast("پارەدانەوە زیادکرا");
      // نوێکردنەوەی زانیاری قەرز
      Payments.debt = await API.get("/api/debts/" + Payments.debt.id);
      Payments.renderInfo();
      $("payAmount").value = ""; $("payNotes").value = "";
      await Payments.loadList();
      Debts.load();
    } catch (e) { toast(e.message, "err"); }
  },

  remove(id) {
    confirmDialog("سڕینەوەی ئەم پارەدانەوەیە؟", async () => {
      try {
        await API.del("/api/payments/" + id);
        toast("پارەدانەوە سڕایەوە");
        Payments.debt = await API.get("/api/debts/" + Payments.debt.id);
        Payments.renderInfo();
        await Payments.loadList();
        Debts.load();
      } catch (e) { toast(e.message, "err"); }
    });
  },
};

/* ================================================================
   ڕاپۆرت
   ================================================================ */
const Reports = {
  period: "daily",
  last: null,

  load() {
    if (!Reports._bound) {
      $("reportTabs").addEventListener("click", (e) => {
        const b = e.target.closest(".tab-btn"); if (!b) return;
        document.querySelectorAll("#reportTabs .tab-btn").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        Reports.period = b.dataset.period;
        Reports.fetch();
      });
      Reports._bound = true;
    }
    Reports.fetch();
  },

  async fetch() {
    try {
      const r = await DB.report(Reports.period);
      Reports.last = r;
      $("reportSummary").innerHTML = `
        <div class="rs-card debt"><div class="label">کۆی قەرز</div><div class="value">${money(r.total_debt)}</div></div>
        <div class="rs-card paid"><div class="label">کۆی پارەدانەوە</div><div class="value">${money(r.total_paid)}</div></div>
        <div class="rs-card remain"><div class="label">پارەی ماوە</div><div class="value">${money(r.remaining)}</div></div>`;
      const body = $("reportBody");
      if (r.items.length === 0) {
        body.innerHTML = `<div class="empty"><div class="big">📈</div>هیچ داتایەک نییە بۆ ئەم ماوەیە</div>`;
      } else {
        body.innerHTML = r.items.map((it) => `
          <div class="rec-card">
            <div class="rc-head">
              <div class="rc-title">
                <span class="rc-name">${esc(it.customer_name)}</span>
                <span class="rc-date">📅 ${esc(it.date)}</span>
              </div>
              ${statusPill(it.status)}
            </div>
            ${it.subject ? `<div class="rc-subject">${esc(it.subject)}</div>` : ""}
            <div class="rc-figures">
              <div class="fig"><span class="lbl">بڕی قەرز</span><span class="v">${money(it.amount)}</span></div>
              <div class="fig"><span class="lbl">دراو</span><span class="v ok">${money(it.paid)}</span></div>
              <div class="fig"><span class="lbl">ماوە</span><span class="v ${it.remaining > 0 ? "bad" : "ok"}">${money(it.remaining)}</span></div>
            </div>
          </div>`).join("");
      }
    } catch (e) { toast(e.message, "err"); }
  },

  async exportFile(kind) {
    const r = Reports.last;
    if (!r || !r.items) { toast("سەرەتا ڕاپۆرت پیشان بدە", "err"); return; }
    if (kind === "pdf") { Reports.printReport(); return; }  // PDF بە چاپ
    // Excel → فایلی CSV (لە Excel دەکرێتەوە)
    const head = ["بەروار", "ناوی کڕیار", "بابەت", "بڕی قەرز", "پارەی دراو", "ماوە", "دۆخ"];
    const lines = [head.join(",")];
    r.items.forEach((it) => {
      const row = [it.date, it.customer_name || "", it.subject || "", it.amount, it.paid, it.remaining, it.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    });
    lines.push(["", "", "کۆی گشتی", r.total_debt, r.total_paid, r.remaining, ""].join(","));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${Reports.period}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast("فایلی CSV داگیرا");
  },

  printReport() {
    const r = Reports.last;
    if (!r || !r.items) { toast("سەرەتا ڕاپۆرت پیشان بدە", "err"); return; }
    const PL = { daily: "ڕۆژانە", weekly: "هەفتانە", monthly: "مانگانە", yearly: "ساڵانە" };
    const rows = r.items.map((it) => `
      <tr>
        <td>${esc(it.date)}</td><td>${esc(it.customer_name)}</td><td>${esc(it.subject) || "—"}</td>
        <td class="n">${money(it.amount)}</td><td class="n">${money(it.paid)}</td>
        <td class="n">${money(it.remaining)}</td><td>${esc(it.status)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="ckb" dir="rtl"><head><meta charset="UTF-8"><title>ڕاپۆرت</title><style>
      @font-face{font-family:"Vazirmatn";src:url("${location.origin}/assets/fonts/Vazirmatn.woff2") format("woff2");}
      @page{size:A4 landscape;margin:12mm;}
      *{font-family:"Vazirmatn",sans-serif;box-sizing:border-box;}
      body{direction:rtl;color:#0f172a;margin:0;}
      h1{text-align:center;font-size:19px;margin:0 0 4px;}
      .sub{text-align:center;color:#64748b;font-size:12px;margin-bottom:16px;}
      .totals{display:flex;gap:12px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;}
      .tot{border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 18px;text-align:center;}
      .tot .l{font-size:11px;color:#64748b;} .tot .v{font-size:16px;font-weight:800;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      th{background:#2563eb;color:#fff;padding:8px;} td{padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:center;}
      td.n{font-weight:700;} tr:nth-child(even) td{background:#f8fafc;}
      </style></head><body>
      <h1>مارکێتی بەهەند — ڕاپۆرتی قەرز (${PL[r.period] || r.period})</h1>
      <div class="sub">لە ${esc(r.date_from)} بۆ ${esc(r.date_to)}</div>
      <div class="totals">
        <div class="tot"><div class="l">کۆی قەرز</div><div class="v">${money(r.total_debt)}</div></div>
        <div class="tot"><div class="l">کۆی پارەدانەوە</div><div class="v" style="color:#16a34a">${money(r.total_paid)}</div></div>
        <div class="tot"><div class="l">پارەی ماوە</div><div class="v" style="color:#dc2626">${money(r.remaining)}</div></div>
      </div>
      <table><thead><tr><th>بەروار</th><th>ناوی کڕیار</th><th>بابەت</th><th>بڕی قەرز</th><th>پارەی دراو</th><th>ماوە</th><th>دۆخ</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>function go(){window.print();setTimeout(function(){window.close();},500);}
      if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(go,150);});}else{window.onload=go;}<\/script>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast("تکایە ڕێگە بە پەنجەرەی نوێ بدە", "err"); return; }
    w.document.open(); w.document.write(html); w.document.close();
  },
};

/* ================================================================
   پاڵپشت
   ================================================================ */
const Backup = {
  async load() {
    try {
      // دۆخی OneDrive
      try {
        const od = await API.get("/api/backup/onedrive");
        const el = $("onedriveStatus");
        if (od.enabled) {
          el.innerHTML = `<span class="ic">☁️</span><div>پاڵپشتی خۆکاری ڕۆژانە بۆ OneDrive دەنێردرێت: <b>${esc(od.path)}</b></div>`;
          el.style.background = "#f0fdf4"; el.style.borderColor = "#bbf7d0"; el.style.color = "#166534";
        } else {
          el.innerHTML = `<span class="ic">☁️</span><div>OneDrive نەدۆزرایەوە — پاڵپشتەکان تەنها بەشێوەی خۆماڵی هەڵدەگیرێن. بۆ پاڵپشتی دەرەکی، OneDrive دابمەزرێنە.</div>`;
          el.style.background = "#fef9c3"; el.style.borderColor = "#fde68a"; el.style.color = "#854d0e";
        }
        el.style.display = "";
      } catch (_) { /* پشتگوێخستن */ }

      const rows = await API.get("/api/backup");
      const body = $("backupBody");
      const isAdmin = CURRENT_USER.role === "admin";
      if (rows.length === 0) {
        body.innerHTML = `<tr><td colspan="4"><div class="empty"><div class="big">💾</div>هیچ پاڵپشتێک نییە</div></td></tr>`;
      } else {
        body.innerHTML = rows.map((b) => `
          <tr>
            <td class="num">${esc(b.name)}</td>
            <td class="num">${(b.size / 1024).toFixed(0)} KB</td>
            <td class="num">${esc(b.created_at)}</td>
            <td><div class="t-actions">
              <button class="btn-icon" title="داگرتن" onclick="Backup.download('${esc(b.name)}')">⬇️</button>
              ${isAdmin ? `<button class="btn-icon" title="گەڕاندنەوە" onclick="Backup.restore('${esc(b.name)}')">♻️</button>` : ""}
            </div></td>
          </tr>`).join("");
      }
    } catch (e) { toast(e.message, "err"); }
  },

  async create() {
    try { await API.post("/api/backup/create"); toast("پاڵپشت دروستکرا"); Backup.load(); }
    catch (e) { toast(e.message, "err"); }
  },

  async download(name) {
    try { await API.download("/api/backup/download/" + encodeURIComponent(name), name); toast("پاڵپشت داگیرا"); }
    catch (e) { toast(e.message, "err"); }
  },

  restore(name) {
    confirmDialog(`گەڕاندنەوە بۆ «${name}» هەموو داتای ئێستا دەگۆڕێت (پاڵپشتێکی ئاسایشی پێش گەڕاندنەوە دروست دەکرێت). دڵنیایت؟`,
      async () => {
        try { await API.post("/api/backup/restore/" + encodeURIComponent(name)); toast("گەڕاندنەوە سەرکەوتوو بوو"); Backup.load(); Dashboard.load(); }
        catch (e) { toast(e.message, "err"); }
      }, "گەڕاندنەوەی پاڵپشت");
  },

  uploadRestore(input) {
    const file = input.files[0]; if (!file) return;
    confirmDialog(`گەڕاندنەوە لە فایلی «${file.name}» هەموو داتای ئێستا دەگۆڕێت. دڵنیایت؟`, async () => {
      try {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/backup/upload-restore", {
          method: "POST", headers: { Authorization: "Bearer " + API.token() }, body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "گەڕاندنەوە سەرنەکەوت");
        toast("گەڕاندنەوە سەرکەوتوو بوو"); Backup.load(); Dashboard.load();
      } catch (e) { toast(e.message, "err"); }
      finally { input.value = ""; }
    }, "گەڕاندنەوە لە فایل");
  },
};

/* ================================================================
   بەکارهێنەران
   ================================================================ */
const Users = {
  async load() {
    if (CURRENT_USER.role !== "admin") return;
    try {
      const rows = await DB.users();
      $("usersBody").innerHTML = rows.map((u) => `
        <tr>
          <td><b>${esc(u.email || u.full_name || u.id)}</b></td>
          <td>${esc(u.full_name) || "—"}</td>
          <td>${u.role === "admin" ? '<span class="pill pill-success">بەڕێوەبەر</span>' : '<span class="pill" style="background:#e0e7ff;color:#3730a3">بەکارهێنەر</span>'}</td>
          <td>${u.active !== false ? "چالاک" : '<span style="color:var(--muted)">ناچالاک</span>'}</td>
          <td><div class="t-actions">
            <button class="btn-icon" title="دەستکاری" onclick='Users.openForm(${JSON.stringify(u)})'>✏️</button>
            ${u.id !== CURRENT_USER.id ? `<button class="btn-icon danger" title="سڕینەوە" onclick="Users.remove('${esc(u.id)}')">🗑️</button>` : ""}
          </div></td>
        </tr>`).join("");
    } catch (e) { toast(e.message, "err"); }
  },

  openForm(u = null) {
    $("userModalTitle").textContent = u ? "دەستکاریکردنی بەکارهێنەر" : "بەکارهێنەری نوێ";
    $("userId").value = u?.id || "";
    $("uUsername").value = u?.email || "";
    $("uUsername").disabled = !!u;                 // ئیمەیل ناگۆڕدرێت
    $("uFullName").value = u?.full_name || "";
    $("uPassword").value = "";
    $("uRole").value = u?.role || "user";
    $("pwHint").textContent = u ? "(تەنها لە کاتی دروستکردندا)" : "";
    document.getElementById("uPassword").parentElement.style.display = u ? "none" : "";
    openModal("userModal");
  },

  async save() {
    const id = $("userId").value;
    const email = $("uUsername").value.trim();
    const password = $("uPassword").value;
    const full_name = $("uFullName").value.trim() || null;
    const role = $("uRole").value;

    if (!id) {
      if (!email || !email.includes("@")) { toast("ئیمەیلی دروست پێویستە", "err"); return; }
      if (!password || password.length < 6) { toast("وشەی نهێنی پێویستە (٦ پیت یان زیاتر)", "err"); return; }
    }
    try {
      if (id) {
        await DB.saveUser(id, { full_name, role });
      } else {
        await DB.createUser(email, password, full_name, role);
      }
      closeModal("userModal");
      toast(id ? "بەکارهێنەر نوێکرایەوە" : "بەکارهێنەر زیادکرا");
      Users.load();
    } catch (e) {
      let m = e.message;
      if (e.code === "auth/email-already-in-use") m = "ئەم ئیمەیلە پێشتر بەکارهاتووە";
      toast(m, "err");
    }
  },

  remove(id, name) {
    confirmDialog(`سڕینەوەی بەکارهێنەری «${name}»؟ (تۆمارەکەی لە سیستەم دەسڕدرێتەوە — بۆ سڕینەوەی تەواو، لە Firebase Console → Authentication هەژمارەکەشی بسڕەوە)`, async () => {
      try { await DB.deleteUserDoc(id); toast("بەکارهێنەر سڕایەوە"); Users.load(); }
      catch (e) { toast(e.message, "err"); }
    });
  },
};

/* ---------------- یارمەتی: debounce ---------------- */
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ---------------- بەستنەوە بە window بۆ هاندلەرەکان (onclick) ---------------- */
Object.assign(window, {
  Dashboard, Customers, Debts, Payments, Reports, Backup, Users, CustomerDebts,
  navigate, openModal, closeModal, confirmDialog,
});

/* ---------------- دەستپێکردنی سیستەم (لە کۆتاییدا) ---------------- */
init();
