# Paatilk Sweets & Bakes — Online Sweet Shop

Single-page static website for a home-based sweet shop in Velachery, Chennai, with a product menu, search and filters, a cart drawer and WhatsApp checkout.

| Layer | Stack |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+), all inside one `index.html` |
| Backend | None |
| Database | None. The cart is saved in the browser's LocalStorage |
| Ordering | WhatsApp click-to-chat (`https://wa.me/919876543210`) |

There is no server, so orders are not stored anywhere. Each order is sent as a WhatsApp message and the shop confirms it there.

```
public_html/
├── index.html               The whole site (HTML + CSS + JavaScript)
├── README.md                This file
└── images/
    └── products/            Optional: your own product photos
```

Inside `index.html`:

```
<style>                      Brand colours, layout, cart drawer, responsive rules
<body>                       Nav, Hero, Shop, About, Diwali, Testimonials, Delivery, Contact, Footer, Cart drawer
<script>
  ├── BIZ                    Business settings (WhatsApp number, delivery radius, Diwali notice)
  ├── PRODUCTS               Editable menu data (names, prices, weights, descriptions)
  ├── cart functions         add / remove / quantity / totals / LocalStorage
  └── checkout()             Validation + WhatsApp message builder
```

## Prerequisites

- Any modern browser (Chrome, Edge, Firefox, Safari).
- Nothing to install. No Node.js, Java, Maven or database.
- An internet connection for the Google Fonts. Without it the site falls back to system fonts.

## 1. Run locally

Double-click `index.html`, or serve the folder:

```bash
cd public_html
python3 -m http.server 8000     # then open http://localhost:8000
```

## 2. Business configuration

All business settings are in one object near the top of the `<script>` in `index.html`:

| Setting | Current value |
|---|---|
| `BIZ.name` | Paatilk Sweets & Bakes |
| `BIZ.whatsapp` | `919876543210` (country code + number, digits only) |
| `BIZ.deliveryKm` | `5` |
| `BIZ.diwaliNoticeDays` | `2` |
| `BIZ.cur` | `₹` |

Also update these in the page text when anything changes: opening hours (Contact section), the displayed phone number, and the `ld+json` block in `<head>` (structured data for Google).

## 3. Products

Each product is one line in the `PRODUCTS` array:

```js
{id:'kaju-katli', name:'Kaju Katli', cat:'Diwali Specials', base:950, unit:'per kg',
 opts:KG, desc:'Thin cashew diamonds with silver varq.', color:'#EFE3C4', diwali:true}
```

| Field | Meaning |
|---|---|
| `base` | Price of the default unit: 1 kg, 1 box, or one 500g cake |
| `opts` | Selectable sizes. `KG` gives 250g (×0.25), 500g (×0.5) and 1kg (×1). Boxes use `[{l:'1 box',f:1}]`. The cake uses 500g (×1) and 1kg (×2) |
| `cat` | One of the categories in `CATS`: Diwali Specials, Sweets, Savouries, Bakes |
| `diwali` | `true` means the 2-day notice rule applies when this item is in the cart |
| `img` | Optional photo path, e.g. `images/products/kaju-katli.jpg`. Without it, a placeholder illustration is shown |

Unit prices are rounded to whole rupees, so the price on the card, in the cart and in the WhatsApp message always match.

Current menu: Diwali Combo Box ₹699 per box · Kaju Katli ₹950/kg · Mysore Pak ₹480/kg · Badam Halwa ₹720/kg · Gulab Jamun ₹400/kg · Adhirasam ₹420/kg · Ribbon Pakoda ₹360/kg · Murukku ₹380/kg · Eggless Plum Cake ₹550 per 500g.

## Checkout rules

Before WhatsApp opens, the cart form checks:

- Name is required.
- Phone must be a valid 10-digit Indian mobile number (a +91, 91 or 0 prefix is accepted).
- A delivery or pickup choice and a date are required, and the date cannot be in the past.
- Sunday orders must be Pickup.
- If the cart has a Diwali item, the date must be at least `diwaliNoticeDays` days from today.
- Delivery needs an address and a tick confirming it is within 5 km of Velachery.

The message sent to WhatsApp contains each item with weight, quantity, unit price and line total, then total quantity, subtotal, grand total, name, phone, preference, date, address (for delivery) and notes. No delivery fee is added, because none was specified.

## 4. Deploy to Hostinger

1. Log in to hPanel, then Websites, then File Manager, and open `public_html`.
2. Upload `index.html` (and the `images` folder if you use your own photos). `index.html` must sit directly inside `public_html`.
3. Open your domain and check it loads.
4. Add your domain to the `<meta property="og:*">` tags and the structured data if you want rich link previews.

To update the site later, edit `index.html` and upload it again, replacing the old file.

## Testing status

The JavaScript syntax, the DOM ids it uses and the weight-based price calculations were checked automatically. The site has **not** been tested in a real browser. Before going live, check:

- Adding items in different weights, changing quantities, removing, and reloading to confirm the cart persists.
- Search and each category filter.
- The mobile menu and layouts on phone, tablet and desktop (no horizontal scroll).
- Each validation message at checkout, then a real test order to your WhatsApp.

## Troubleshooting

- **Product images look like simple drawings:** those are placeholders. Add real photos and set `img` on each product.
- **WhatsApp opens but the message is empty:** a browser extension or pop-up blocker may be interfering. Allow pop-ups for the site.
- **Cart is empty after reload:** the browser is blocking LocalStorage (private mode or strict privacy settings).
- **Date picker won't accept a day:** past dates are blocked. For Diwali items, choose a date at least 2 days ahead.
- **Changes don't appear after upload:** clear the Hostinger or browser cache and hard-refresh (Ctrl+F5).
- **Fonts look different:** Google Fonts could not load, so system fonts are used. This is cosmetic only.

## Sample content to replace

- The three testimonials are marked as samples. Replace them with genuine customer reviews.
- The hero and product images are generated placeholders until you add photos.
