# UI Plan — Car Inventory (Cyberpunk theme)

Theme file: `frontend/src/index.css` (Tailwind v4, adapted from my portfolio somvanshi.dev).
Product/data decisions that affect the backend live in `PLAN.md` → "Product Spec".

---

## 1. Look & Feel

- **Palette:** signature yellow `#f5d800` page background with black text; only the header is black; dark panels (`#080808`) for cards, forms and modals; red `#fd3649` actions/danger, cyan `#00e6f6` accents/focus.
- **Fonts:** Rajdhani (headings, buttons, labels), Share Tech Mono (prices, stock, IDs).
- **Motifs:** chamfered corners, `///MODULE` strips, glitch headings (effects adapted from CodePen — credited in README), scanline "screens", label│value badges.
- **Rules:** neon for accents only; body text ≥ 4.5:1 contrast; black text on red and yellow fills (black on `#fd3649` is 5.8:1, white only 3.6:1); disabled states obvious; animations off under `prefers-reduced-motion`.
- **App name:** Rayfield Autoshow. Prices in USD.

### Header & Logo
- Black header bar, full width, sticky. The yellow module strip directly below doubles as its divider.
- **Left:** brand lockup `[logo] | RAYFIELD AUTOSHOW`: Rayfield logo (white PNG, used as-is), thin vertical divider, name in white Rajdhani with wide tracking. Below `sm` the text shortens to `AUTOSHOW` (the logo already says RAYFIELD). Links to `/`.
- **Right:** nav links (INVENTORY · LOGOUT) + signed-in user's name (from `xl`); hamburger below `lg`, since the longer name needs the room. On `/login` and `/register` only the brand shows.
- Logo file: `Thumbnails-144.png` → `frontend/src/assets/rayfield-logo.png` (2314×611), `alt="Rayfield"`, ~36px tall on mobile, ~56px on desktop.
- Footer disclaimer: "Rayfield is a fictional brand from Cyberpunk 2077 © CD PROJEKT RED. Fan project, not affiliated." The README credits the logo as well.
- Favicon: the shield "R" emblem cropped from the logo, white on a black square (`frontend/src/assets/rayfield-icon.png`).

## 2. Pages & Routes

| Route | Who | Content |
|---|---|---|
| `/login` | guest | Login form, link to register |
| `/register` | guest | Name, email, password, confirm password; logs in automatically on success |
| `/` | logged in | Inventory: search panel + vehicle grid. Admins also get an "Add vehicle" button and edit/delete/restock on each card |
| `*` | all | 404 `///SIGNAL.LOST` |

Guests are redirected to `/login`. There is no `/admin` route: admin controls render on `/` by role.

## 3. Layout

```
┌───────────────────────────────────────────────┐
│ [R] | RAYFIELD AUTOSHOW       INVENTORY LOGOUT│  ← black header, [R] = logo (hamburger < lg)
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
Mobile: filters collapse into a "FILTERS" toggle above the grid. Admins get an "ADD VEHICLE" button above the grid.

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

Admin controls appear on `/` for admins only (no separate admin page).

- **Add / Edit:** modal `cyber-panel` form: make, model, year, category (select), price, image URL (optional); quantity only on **add** (initial stock, 0–10,000). Edit always sends every field (PUT is a full replacement).
- **Category options:** from `src/constants/categories.ts`, a copy of the backend list (keep in sync).
- **Restock:** small inline popover, quantity input (1–10,000) + confirm.
- **Delete:** in-page confirm ("DELETE LAND CRUISER? [CONFIRM] [CANCEL]"), no `window.confirm`.
- Client-side validation mirrors backend rules; server errors (`details[].field`) shown under the matching field.

## 7. States

| State | UI |
|---|---|
| Loading | module strip `loading...` + skeleton cards |
| Empty inventory | `///NO.UNITS.IN.STOCK` (+ "Add vehicle" for admin) |
| No search results | `///NO.MATCH` + clear filters button |
| API error | red toast + retry |
| Purchase success | cyan toast "UNIT ACQUIRED", stock updates in place |
| Purchase 409 | red toast "OUT OF STOCK", card refreshes |
| Session expired (401) | logout + redirect to login with message — except for `/api/auth/*`, where a 401 (e.g. wrong password) shows the login error instead |

## 8. Responsive

Grid: 1 col (< 640px) → 2 (sm) → 3 (lg) → 4 (xl). Header → hamburger below lg. Modals full-screen on mobile.

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
| `NotFound` (page) | `cyber-panel`, glitch heading `///SIGNAL.LOST` |

## 10. Frontend Tests

The single frontend test list (PLAN.md §5 points here). One `[ ]` = one behaviour; write the test first.

**API client**
- [x] Attaches `Authorization: Bearer <token>` when logged in
- [x] Turns the error format into `{ code, message, details }`
- [x] A 401 from a non-auth call logs out and redirects to `/login` with a "session expired" message
- [x] A 401 from `/api/auth/*` does **not** trigger that redirect
- [x] A non-JSON response or a network failure becomes an `ApiError` with a friendly message ("Can't reach the server. Please try again.")

**Auth**
- [x] Register form shows validation messages
- [x] Confirm-password mismatch shows an error and sends nothing
- [x] Successful register logs in automatically and lands on `/`
- [x] Register shows the API error (e.g. 409 "Email is already registered")
- [x] Login shows the API error on 401
- [x] Successful login redirects to `/`
- [x] Logout clears the token and returns to `/login`
- [x] Protected route redirects a guest to `/login`

**Inventory**
- [x] Cards show make, model, year, category, USD price and stock
- [x] Loading shows skeleton cards
- [x] Empty inventory shows `///NO.UNITS.IN.STOCK`
- [x] API error shows the red toast with retry
- [x] Purchase button disabled when quantity is 0 (required)
- [x] Sold-out badge shown at 0
- [x] Purchase click calls the API and updates the stock shown
- [x] Purchase success shows the "UNIT ACQUIRED" toast
- [x] Purchase 409 shows the "OUT OF STOCK" toast and refreshes the card

**Search / filter**
- [x] Search submits only filled params
- [x] "In stock only" hides sold-out vehicles (client-side)
- [x] Clear resets the filters and the list
- [x] No search results show `///NO.MATCH` with a clear-filters button (§7)

**Admin**
- [x] Admin controls hidden for regular users
- [x] Vehicle form shows validation errors (client-side)
- [x] Server validation errors show under the matching field
- [x] A save error without field details shows above the fields
- [x] Adding a vehicle shows it in the grid
- [ ] Edit opens the form prefilled
- [ ] Saving an edit updates the card
- [ ] Delete asks for in-page confirmation
- [ ] Confirming delete removes the card
- [ ] Restock updates the stock shown
