# UI Plan — Car Inventory (Cyberpunk theme)

Theme file: `frontend/src/index.css` (Tailwind v4, adapted from my portfolio somvanshi.dev).
Product/data decisions that affect the backend live in `PLAN.md` → "Product Spec".

---

## 1. Look & Feel

- **Palette:** black background, yellow `#f5d800` primary, red `#fd3649` actions/danger, cyan `#00e6f6` accents/focus.
- **Fonts:** Rajdhani (headings, buttons, labels), Share Tech Mono (prices, stock, IDs).
- **Motifs:** chamfered corners, `///MODULE` strips, glitch headings, scanline "screens", label│value badges.
- **Rules:** neon for accents only; body text ≥ 4.5:1 contrast; disabled states obvious; animations off under `prefers-reduced-motion`.
- **App name:** Rayfield Autoshow. Prices in USD.

### Header & Logo
- Black header bar, full width, sticky. The yellow module strip directly below doubles as its divider.
- **Top right:** brand lockup `[logo] | RAYFIELD AUTOSHOW`: Rayfield logo (white PNG, used as-is), thin vertical divider, name in white Rajdhani with wide tracking. Below `sm` the text shortens to `AUTOSHOW` (the logo already says RAYFIELD). Links to `/`.
- **Left:** nav links (INVENTORY · ADMIN for admins only · LOGOUT) + signed-in user's name (from `xl`); hamburger below `lg`, since the longer name needs the room. On `/login` and `/register` only the brand shows.
- Logo file: `Thumbnails-144.png` → `frontend/src/assets/rayfield-logo.png` (2314×611), `alt="Rayfield"`, ~36px tall on mobile, ~56px on desktop.
- Footer disclaimer: "Rayfield is a fictional brand from Cyberpunk 2077 © CD PROJEKT RED. Fan project, not affiliated."
- Optional: crop the shield "R" emblem as the favicon.

## 2. Pages & Routes

| Route | Who | Content |
|---|---|---|
| `/login` | guest | Login form, link to register |
| `/register` | guest | Name, email, password, confirm password |
| `/` | logged in | Inventory: search panel + vehicle grid |
| `/admin` | admin | Same grid + "Add vehicle" button, edit/delete/restock on each card |
| `*` | all | 404 `///SIGNAL.LOST` |

Guests are redirected to `/login`; non-admins hitting `/admin` are redirected to `/`.

## 3. Layout

```
┌───────────────────────────────────────────────┐
│ INVENTORY ADMIN LOGOUT [R] | RAYFIELD AUTOSHOW│  ← black header, [R] = logo (hamburger < lg)
│ ///INVENTORY.MODULE  24 UNITS ▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮│  ← yellow module strip (header divider)
├────────────┬──────────────────────────────────┤
│ SEARCH     │  [card] [card] [card]             │
│ make       │  [card] [card] [card]             │
│ model      │                                   │
│ category ▾ │                                   │
│ price min–max                                  │
│ [x] in stock only                              │
│ [SEARCH_] [CLEAR]                              │
└────────────┴──────────────────────────────────┘
```
Mobile: filters collapse into a "FILTERS" toggle above the grid.

## 4. Vehicle Card

```
┌──────────────────────────────╲
│  ░░ cyber-screen ░░           │  image (imageUrl) or category icon
│  ░░  [SUV icon]  ░░           │
├──────────────────────────────┤
│ TOYOTA                  2024 │  make (small, muted) + year
│ LAND CRUISER                 │  model (large, bold)
│ [CATEGORY│SUV] [STOCK│03]    │  badges; STOCK│SOLD OUT in red at 0
│ $125,000.00                  │  price, mono, USD
│ [ PURCHASE_ ]                │  disabled when quantity = 0
│ admin: [EDIT] [RESTOCK] [DEL]│
╲──────────────────────────────┘
```
- Low stock (1–3): cyan "ONLY 2 LEFT" badge.

## 5. Actions by Role

| Action | Guest | User | Admin |
|---|---|---|---|
| Register / login | ✅ | – | – |
| View & search vehicles | ❌ | ✅ | ✅ |
| Purchase (1 unit) | ❌ | ✅ | ✅ |
| Add / edit vehicle | ❌ | ❌ | ✅ |
| Delete vehicle | ❌ | ❌ | ✅ |
| Restock | ❌ | ❌ | ✅ |

## 6. Admin UI

- **Add / Edit:** modal `cyber-panel` form: make, model, year, category (select), price, image URL (optional); quantity only on **add** (initial stock).
- **Restock:** small inline popover, quantity input (positive integer) + confirm.
- **Delete:** in-page confirm ("DELETE LAND CRUISER? [CONFIRM] [CANCEL]"), no `window.confirm`.
- Client-side validation mirrors backend rules; server errors shown under fields.

## 7. States

| State | UI |
|---|---|
| Loading | module strip `loading...` + skeleton cards |
| Empty inventory | `///NO.UNITS.IN.STOCK` (+ "Add vehicle" for admin) |
| No search results | `///NO.MATCH` + clear filters button |
| API error | red toast + retry |
| Purchase success | cyan toast "UNIT ACQUIRED", stock updates in place |
| Purchase 409 | red toast "OUT OF STOCK", card refreshes |
| Session expired (401) | logout + redirect to login with message |

## 8. Responsive

Grid: 1 col (< 640px) → 2 (sm) → 3 (lg) → 4 (xl). Navbar → hamburger below md. Modals full-screen on mobile.

## 9. Components → Theme Classes

| Component | Classes |
|---|---|
| `Header` | `cyber-header`, `cyber-nav-link`, `brand`, `brand-logo`, `brand-name` |
| `ModuleStrip` | `module-strip` |
| `VehicleCard` | `cyber-panel`, `cyber-screen`, `cyber-badge`, `btn-cyber` |
| `SearchPanel` | `cyber-input`, `cyber-label`, `btn-cyber`, `btn-ghost` |
| `VehicleFormModal` | `cyber-panel`, `cyber-input`, `cyber-error` |
| `ConfirmDialog`, `RestockPopover` | `cyber-panel`, `btn-danger`, `btn-ghost` |
| `Toast` | `cyber-toast` |
| `CategoryIcon` | inline SVG per category, yellow stroke |

## 10. Key Frontend Tests

- [ ] Purchase button disabled when quantity is 0 (required)
- [ ] Purchase click calls API and updates stock shown
- [ ] Sold-out badge shown at 0
- [ ] Admin controls hidden for regular users
- [ ] Search submits only filled params
- [ ] Login shows error on 401; success redirects
- [ ] Protected route redirects guest to `/login`
- [ ] Vehicle form shows validation errors
