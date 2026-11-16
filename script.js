/* 1. SHOP CONFIGURATION */
const SHOP_CONFIG = {
  whatsappNumber: "74186 79629", // your WhatsApp number: 10 digits (spaces ok). India code 91 is added automatically
  shopName: "Paati Kadai",
  currency: "INR",
  currencySymbol: "₹",
  minimumAdvanceDays: 2,
  deliveryRadiusKm: 5,
  deliveryFee: 0 // rupees; keep 0 until a real delivery charge is set
};

/* 2. PRODUCT DATA / PRICES  (edit prices here; kind "kg" => 0.25 kg steps, "unit" => 1 step)
   Product images live in index.html as <img> tags; each card links to this list by data-id. */
const PRODUCTS = [
  { id: "combo-box", name: "Diwali Combo Box", price: 769, kind: "unit", label: "box", plural: "boxes" },
  { id: "kaju-katli", name: "Kaju Katli", price: 950, kind: "kg" },
  { id: "mysore-pak", name: "Mysore Pak", price: 480, kind: "kg" },
  { id: "badam-halwa", name: "Badam Halwa", price: 720, kind: "kg" },
  { id: "gulab-jamun", name: "Gulab Jamun", price: 480, kind: "kg" },
  { id: "adhirasam", name: "Adhirasam", price: 420, kind: "kg" },
  { id: "ribbon-pakoda", name: "Ribbon Pakoda", price: 360, kind: "kg" },
  { id: "murukku", name: "Murukku", price: 380, kind: "kg" },
  { id: "plum-cake", name: "Eggless Plum Cake", price: 550, kind: "unit", label: "pack (500g)", plural: "packs (500g)" }
];
const byId = id => PRODUCTS.find(p => p.id === id);
// digits only; a 10-digit Indian number gets the 91 country code added
const waNumber = () => { let n = String(SHOP_CONFIG.whatsappNumber).replace(/\D/g, "").replace(/^0+/, ""); return n.length === 10 ? "91" + n : n; };
const waReady = () => /^[1-9]\d{10,14}$/.test(waNumber());

/* 3. CURRENCY (money handled in integer paise) */
const fmt = paise => {
  const r = paise / 100;
  return SHOP_CONFIG.currencySymbol + r.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 });
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* 5/12. QUANTITY + PRICE CALCULATION (q = integer steps: kg => quarter-kg, unit => whole units) */
const linePaise = (p, q) => p.kind === "kg" ? p.price * 25 * q : p.price * 100 * q;
const qtyText = (p, q) => p.kind === "kg" ? (q / 4).toFixed(2) + " kg" : q + " " + (q === 1 ? p.label : p.plural);
const rateText = p => SHOP_CONFIG.currencySymbol + p.price.toLocaleString("en-IN") + "/" + (p.kind === "kg" ? "kg" : p.label);
const unitType = p => p.kind === "kg" ? "kg" : "unit";

/* 4. PRODUCT CARDS (markup + images are in index.html; JS only wires them up) */
function updateCard(card) {
  const p = byId(card.dataset.id); if (!p) return;
  const q = +card.dataset.q || 1;
  $("[data-qty]", card).textContent = qtyText(p, q);
  $("[data-line]", card).textContent = fmt(linePaise(p, q));
}
function initCards() {
  $$(".card[data-id]").forEach(card => {
    const p = byId(card.dataset.id);
    if (!p) { console.warn("Unknown product id:", card.dataset.id); return; }
    card.dataset.q = 1;
    $("[data-price]", card).textContent = rateText(p);
    updateCard(card);
  });
}
function onCardClick(e) {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const card = b.closest(".card"); if (!card) return;
  const p = byId(card.dataset.id); if (!p) return;
  let q = +card.dataset.q || 1; const act = b.dataset.act;
  if (act === "plus") q = Math.min(q + 1, 400);
  if (act === "minus") q = Math.max(q - 1, 1);
  if (act === "add") { addToCart(p.id, q); q = 1; toast(`${p.name} added to your order`); }
  card.dataset.q = q; updateCard(card);
}

/* 7. LOCAL STORAGE */
const KEY = "paatiKadaiCart";
let cart = [];
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    cart = raw.filter(i => byId(i.id) && Number.isInteger(i.q) && i.q > 0).map(i => ({ id: i.id, q: i.q }));
  } catch { cart = []; }
}
function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart.map(({ id, q }) => ({ id, q })))); } catch { /* storage unavailable */ } }

/* 6. SHOPPING CART (one entry per product) */
function addToCart(id, q) {
  const it = cart.find(i => i.id === id);
  if (it) it.q += q; else cart.push({ id, q });
  cartChanged();
}
function setQty(id, q) {
  const it = cart.find(i => i.id === id); if (!it) return;
  if (q < 1) cart = cart.filter(i => i.id !== id); else it.q = Math.min(q, 400);
  cartChanged();
}
function clearCart() { cart = []; cartChanged(); }
// cart record: id, name, unit price, quantity, unit type, line total
const cartLines = () => cart.map(i => { const p = byId(i.id); return { id: p.id, name: p.name, unitPrice: p.price, quantity: i.q, unitType: unitType(p), lineTotal: linePaise(p, i.q), p }; });
const subtotal = () => cartLines().reduce((s, l) => s + l.lineTotal, 0);
const deliveryFee = () => (currentType() === "Delivery" ? SHOP_CONFIG.deliveryFee * 100 : 0);
const itemCount = () => cart.length;
function cartChanged() { saveCart(); updateBar(); if (!$("#modal").hidden) renderOrder(); }

/* 8. STICKY CART BAR */
function updateBar() {
  const n = itemCount(), bar = $("#orderBar");
  $("#cartCount").textContent = n;
  $("#barItems").textContent = n + (n === 1 ? " Item" : " Items");
  $("#barTotal").textContent = fmt(subtotal());
  if (bar) bar.hidden = n === 0;
  document.body.classList.toggle("has-bar", n > 0);
}

/* 9. ORDER MODAL */
let lastFocus = null;
function openModal() {
  const m = $("#modal"); lastFocus = document.activeElement;
  m.hidden = false; document.body.classList.add("lock");
  renderOrder(); $(".sheet", m).focus();
}
function closeModal() {
  $("#modal").hidden = true; document.body.classList.remove("lock");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function renderOrder() {
  const box = $("#orderItems"), lines = cartLines();
  box.innerHTML = lines.length ? lines.map(l => `<div class="oi" data-id="${l.id}">
      <b>${l.name}</b><b>${fmt(l.lineTotal)}</b>
      <small>${qtyText(l.p, l.quantity)} × ${rateText(l.p)}</small>
      <div class="oi-ctl"><button type="button" data-oi="minus" aria-label="Decrease ${l.name}">−</button><button type="button" data-oi="plus" aria-label="Increase ${l.name}">+</button><button type="button" class="rm" data-oi="rm" aria-label="Remove ${l.name}">Remove</button></div></div>`).join("")
    : `<p class="empty">Your order is empty. Add something sweet from the menu.</p>`;
  const cw = $("#clearWrap"); if (cw) { cw.hidden = !lines.length; if (!lines.length) showClearConfirm(false); }
  updateTotals();
}
function onOrderClick(e) {
  const b = e.target.closest("[data-oi]"); if (!b) return;
  const row = b.closest(".oi"), it = cart.find(i => i.id === row.dataset.id); if (!it) return;
  const a = b.dataset.oi;
  if (a === "plus") setQty(it.id, it.q + 1);
  if (a === "minus") setQty(it.id, it.q - 1);
  if (a === "rm") setQty(it.id, 0);
}
function updateTotals() {
  const s = subtotal(), d = deliveryFee();
  $("#subTotal").textContent = fmt(s); $("#delFee").textContent = fmt(d); $("#grandTotal").textContent = fmt(s + d);
}

/* 10. DELIVERY / PICKUP SWITCH */
const currentType = () => ($('input[name="type"]:checked') || {}).value || "Delivery";
function syncType() {
  const del = currentType() === "Delivery";
  $("#addrWrap").hidden = !del;
  if (!del) setErr("address", "");
  updateTotals();
}

/* 11. FORM VALIDATION */
function minDate() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + SHOP_CONFIG.minimumAdvanceDays); return d; }
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function setErr(field, msg) {
  const e = $("#err-" + field), i = $("#" + field);
  if (e) e.textContent = msg;
  if (i) { i.classList.toggle("bad", !!msg); i.setAttribute("aria-invalid", msg ? "true" : "false"); }
}
function cleanPhone(v) { return v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""); }
function validate() {
  const f = $("#orderForm"), errs = {};
  const name = f.name.value.trim(), phone = cleanPhone(f.phone.value.trim()), date = f.date.value;
  if (!name) errs.name = "Please enter your name.";
  if (!/^[6-9]\d{9}$/.test(phone)) errs.phone = "Enter a valid 10-digit Indian mobile number (optional +91).";
  if (currentType() === "Delivery" && !f.address.value.trim()) errs.address = "Please enter your delivery address.";
  if (!date) errs.date = "Please choose a date.";
  else if (date < iso(minDate())) errs.date = `Please choose ${SHOP_CONFIG.minimumAdvanceDays} or more days from today.`;
  else if (new Date(date + "T00:00").getDay() === 0 && currentType() === "Delivery") errs.date = "Sundays are pickup only. Choose another date or select Pickup.";
  const lines = cartLines();
  const cartErr = !lines.length ? "Your order is empty." : (lines.some(l => !(l.quantity > 0)) || subtotal() <= 0) ? "Please check the quantities in your order." : "";
  ["name", "phone", "address", "date"].forEach(k => setErr(k, errs[k] || ""));
  $("#err-cart").textContent = cartErr;
  const first = Object.keys(errs)[0];
  if (first) $("#" + first).focus();
  return !first && !cartErr;
}

/* 13. WHATSAPP MESSAGE */
function longDate(v) { return new Date(v + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }); }
function buildMessage() {
  const f = $("#orderForm"), type = currentType(), notes = f.notes.value.trim();
  const items = cartLines().map((l, i) => `${i + 1}. ${l.name}\n   Quantity: ${qtyText(l.p, l.quantity)}\n   Rate: ${rateText(l.p)}\n   Line Total: ${fmt(l.lineTotal)}`).join("\n\n");
  const s = subtotal(), d = deliveryFee();
  return [
    `*NEW ORDER – ${SHOP_CONFIG.shopName.toUpperCase()}*`, "",
    "*Customer Details*",
    `Name: ${f.name.value.trim()}`,
    `Phone: ${cleanPhone(f.phone.value.trim())}`,
    `Order Type: ${type}`,
    ...(type === "Delivery" ? [`Address: ${f.address.value.trim().replace(/\s*\n\s*/g, ", ")}`] : []),
    `Preferred Date: ${longDate(f.date.value)}`, "",
    "*ORDER ITEMS*", "", items, "",
    "*ORDER SUMMARY*",
    `Subtotal: ${fmt(s)}`, `Delivery Fee: ${fmt(d)}`, `*GRAND TOTAL: ${fmt(s + d)}*`,
    ...(notes ? ["", "Special Instructions:", notes] : []), "",
    `Thank you for choosing ${SHOP_CONFIG.shopName}!`
  ].join("\n");
}
const waLink = text => `https://wa.me/${waNumber()}` + (text ? `?text=${encodeURIComponent(text)}` : "");
let sending = false;
function submitOrder(e) {
  e.preventDefault();
  if (sending || !validate()) return;
  if (!waReady()) { $("#err-cart").textContent = "The shop's WhatsApp number is not set up yet. Please contact the shop directly."; return; }
  sending = true; setTimeout(() => { sending = false; }, 1500); // avoid double-click duplicates
  window.open(waLink(buildMessage()), "_blank", "noopener,noreferrer");
  $("#ready").hidden = false;
}

/* 14. NAVIGATION */
function initNav() {
  const btn = $("#menuBtn"), links = $("#navLinks");
  if (!btn || !links) return;
  btn.addEventListener("click", () => { const o = links.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
  links.addEventListener("click", e => { if (e.target.closest("a")) { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
}

/* 15. NOTIFICATIONS */
let tt;
function toast(msg) { const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200); }

/* CLEAR ORDER (inline confirmation, no browser pop-up) */
function showClearConfirm(show) {
  const c = $("#clearConfirm"), b = $("#clearCart");
  if (!c || !b) return;
  c.hidden = !show; b.hidden = show;
  (show ? $("#clearNo") : b).focus();
}
function initClearOrder() {
  const btn = $("#clearCart"); if (!btn) return;
  btn.addEventListener("click", () => { if (cart.length) showClearConfirm(true); });
  $("#clearNo").addEventListener("click", () => showClearConfirm(false));
  $("#clearYes").addEventListener("click", () => {
    clearCart(); showClearConfirm(false);
    $("#ready").hidden = true; $("#err-cart").textContent = "";
    closeModal(); toast("Your order has been cleared");
  });
}

/* 16. INIT */
function trapFocus(e) {
  const m = $("#modal"); if (m.hidden) return;
  if (e.key === "Escape") return closeModal();
  if (e.key !== "Tab") return;
  const f = $$('button,input,textarea,a[href]', m).filter(x => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
}
function init() {
  ["#heroWa", "#contactWa", "#footWa", "#waFloat"].forEach(s => {
    const a = $(s); if (!a) return;
    if (waReady()) a.href = waLink("Hello Paati Kadai, I would like to place an order.");
    else a.addEventListener("click", ev => { ev.preventDefault(); toast("WhatsApp number not set yet. Edit SHOP_CONFIG in script.js."); });
  });
  $$("[data-wa-display]").forEach(el => { if (waReady()) el.textContent = "+" + waNumber().replace(/^(\d{2})(\d{5})(\d+)$/, "$1 $2 $3"); });
  loadCart(); initCards(); initNav(); updateBar();
  document.addEventListener("click", onCardClick);
  $("#orderItems").addEventListener("click", onOrderClick);
  ["#cartBtn", "#barBtn"].forEach(s => $(s).addEventListener("click", openModal));
  $("#modal").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", trapFocus);
  $$('input[name="type"]').forEach(r => r.addEventListener("change", syncType));
  $("#orderForm").addEventListener("submit", submitOrder);
  initClearOrder();
  const d = $("#date"); d.min = iso(minDate());
  syncType();
}
document.addEventListener("DOMContentLoaded", init);