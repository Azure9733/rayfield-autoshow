# UI Plan — Car Inventory (Cyberpunk theme)

Theme file: `frontend/src/index.css` (Tailwind v4, adapted from my portfolio somvanshi.dev).
Product/data decisions that affect the backend live in `PLAN.md` → "Product Spec".

---

## 1. Look & Feel

- **Palette:** signature yellow `#f5d800` page background with black text; only the header is black; dark panels (`#080808`) for cards, forms and modals; red `#fd3649` actions/danger, cyan `#00e6f6` accents/focus.
- **Fonts:** Rajdhani (headings, buttons, labels), Share Tech Mono (prices, stock, IDs).
- **Motifs:** chamfered corners, glitch headings (effects adapted from CodePen — credited in README), scanline "screens", label│value badges.
- **Rules:** neon for accents only; body text ≥ 4.5:1 contrast; black text on red and yellow fills (black on `#fd3649` is 5.8:1, white only 3.6:1); disabled states obvious; animations off under `prefers-reduced-motion`.
- **App name:** Rayfield Autoshow. Prices in USD.

### Header & Logo
- Black header bar, full width, sticky.
- **Left:** brand lockup `[logo] | RAYFIELD AUTOSHOW`: Rayfield logo (white PNG, used as-is), thin vertical divider, name in white Rajdhani with wide tracking. Below `sm` the text shortens to `AUTOSHOW` (the logo already says RAYFIELD). Links to `/`.
- **Right:** a person icon + the signed-in user's name (no role shown), then LOGOUT right-most (no INVENTORY link: the logo goes to `/`); hamburger below `lg`: the menu slides and fades in (200 ms) and out (160 ms), its bars morph into a cross while open, and a tap outside the header closes it (reduced motion: instant). Guests see only the brand (the login and register pages link to each other).
- Logo file: `Thumbnails-144.png` → `frontend/src/assets/rayfield-logo.png` (resized from 2314×611 to 424×112, 2x the largest display size), `alt="Rayfield"`, ~36px tall on mobile, ~56px on desktop.
- Boot splash, on every full page load or reload (any route; not on in-app navigation or after login): 0–2 s a solid yellow screen, with lines typed in the top-left corner (24px in, left-aligned, black Share Tech Mono ~11px), one every 333 ms, blinking block cursor after the newest: INITIATE STARTUP... / RESOLVE DNS... / REVERSE PROXY... / SECURE CONNECTION... / SECURED / LOADING...; 2–2.3 s the lines flicker out; 2.3–3.5 s "Welcome to Rayfield Autoshow" centred (black Rajdhani bold, clamp(2rem, 6vw, 4rem), 100 ms glitch-in); 3.5–3.8 s it fades, revealing the app, which has loaded underneath. Any key or click skips. `role="status"`, label "Loading Rayfield Autoshow". Reduced motion: no splash.
- Login transition: right after a successful login or register (not on reload or other navigation), a full-screen black panel wipes away left to right (sharp clip-path, 350 ms, one glitch frame), then the inventory rises 8px and fades in (200 ms). Reduced motion: none.
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
│ [R] | RAYFIELD AUTOSHOW            VIK  LOGOUT│  ← black header, [R] = logo (hamburger < lg)
├───────────────────────────────────────────────┤
│ [ make or model…            ] [FILTERS] [CLEAR]│  ← search bar: results update as you type
│  category ▾ │ min price │ max price │ [x] in stock  ← shown by FILTERS
│                                [ADD VEHICLE]  │  ← admins only
│  [card] [card] [card] [card]                  │
│  [card] [card] [card] [card]                  │
└───────────────────────────────────────────────┘
```
Same on every width: the filters stay folded behind FILTERS until opened. Opening is a sharp clip-path wipe from top to bottom (200 ms, ease-out) after a two-frame flicker; closing wipes back up (160 ms) and then removes the panel (a timer backs up `animationend`); while closing it's already inert and aria-hidden. Reduced motion: open and close instantly. Changes apply live (debounced) and are kept in the URL, so a reload or shared link restores them.

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

### Purchase dialog
- PURCHASE opens a centred `cyber-panel` modal over a dark backdrop: make + model, year, price, CONFIRM PURCHASE (`btn-cyber`, focused) and CANCEL (`btn-ghost`). Cancel, Escape or a backdrop click closes it without buying.
- CONFIRM PURCHASE reads PROCESSING... and is disabled while the request runs.
- Success: the panel switches to a check mark + UNIT ACQUIRED. Motion (about 1.2 s): UNIT ACQUIRED glitches in sharply, the check draws in, and a yellow scan line sweeps across once. The dialog closes itself 1.6 s after success (a click closes it sooner); the card's stock updates behind it.
- 409: OUT OF STOCK in red with CLOSE, and the card refreshes. Other errors: the API message in red with CLOSE. 401: the usual session-expired redirect.
- Reduced motion: no glitch, draw or sweep; the success state appears at once, same 1.6 s auto-close.

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
| Loading | skeleton cards |
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
- [x] A corrupt stored session counts as logged out instead of crashing
- [x] An error response without the `{ error }` shape still becomes an `ApiError`

**Auth**
- [x] Register form shows validation messages
- [x] Confirm-password mismatch shows an error and sends nothing
- [x] Successful register logs in automatically and lands on `/`
- [x] Register shows the API error (e.g. 409 "Email is already registered")
- [x] Login shows the API error on 401
- [x] Successful login redirects to `/`
- [x] Logout clears the token and returns to `/login`
- [x] Protected route redirects a guest to `/login`
- [x] A logged-in user visiting `/login` or `/register` goes to `/`

**Boot splash**
- [x] On a full page load the splash types its six lines in order (one every 333 ms), shows the welcome after 2 s, then the app; a key press skips it (reduced motion: no splash)

**Header**
- [x] Below lg, the Menu button opens and closes the nav
- [x] Tapping outside the header closes the menu (tapping inside the menu doesn't)
- [x] No INVENTORY link in the header (nav or menu); the logo links to `/`
- [x] Logged in, the nav and menu show a person icon + the name only (no role, admins included), with LOGOUT right-most (replaces the shield + ADMIN badge for admins)
- [x] Guests see only the brand in the header: no Menu, LOGIN or REGISTER (replaces the LOGIN / REGISTER corner buttons)

**Not found**
- [x] Unknown routes show `///SIGNAL.LOST` with a link home

**Inventory**
- [x] Cards show make, model, year, category, USD price and stock
- [x] Loading shows skeleton cards
- [x] The `///INVENTORY.MODULE` strip is gone: skeletons alone show loading
- [x] Empty inventory shows `///NO.UNITS.IN.STOCK`
- [x] API error shows the red toast with retry
- [x] Purchase button disabled when quantity is 0 (required)
- [x] Sold-out badge shown at 0
- [x] Low stock (1–3) shows an "Only N left" badge (§4)
- [x] A card image loads lazily and falls back to the category icon if it fails to load
- [x] Purchase click calls the API and updates the stock shown
- [x] Purchase 409 refreshes the card
- [x] If that refresh fails, its error shows as the red toast
- [x] The load-error toast with Retry stays (no auto-dismiss)
- [x] Error toasts have a close button (they never auto-dismiss), the load-error one included

**Purchase dialog**
- [x] Purchase opens a confirmation dialog (make + model, year, price; focus on CONFIRM PURCHASE); Cancel, Escape and the backdrop close it without buying
- [x] CONFIRM PURCHASE shows PROCESSING... and is disabled in flight: a double-click sends one request; the stock updates (replaces "Purchase is disabled while its request is in flight")
- [x] Success shows UNIT ACQUIRED inside the dialog (no toast); it closes itself 1.6 s later, or sooner on a click (replaces the UNIT ACQUIRED toast and its 4 s auto-dismiss)
- [x] Errors show in the dialog in red with CLOSE: OUT OF STOCK for a 409, otherwise the API message (replaces the OUT OF STOCK and purchase-error toasts)

**Search / filter**
- [ ] The search bar has no visible label: placeholder "Search", accessible name "Search"
- [x] Typing in the search bar loads matching vehicles live (`?q=`, make or model), debounced to one request
- [x] Requests carry only the filled filters
- [x] The Filters button shows and hides the other filters (category, price range, in stock only)
- [x] Filters live in the URL: a link restores them, changes update it
- [x] Price filters are checked client-side (min ≤ max, ≥ 0): the message shows under the field and nothing is sent
- [x] "In stock only" hides sold-out vehicles (client-side)
- [x] Clear resets the filters and the list
- [x] No search results show `///NO.MATCH` with a clear-filters button (§7)

**Admin**
- [x] Admin controls hidden for regular users
- [x] Vehicle form shows validation errors (client-side)
- [x] Server validation errors show under the matching field
- [x] A save error without field details shows above the fields
- [x] Adding a vehicle shows it in the grid
- [x] Edit opens the form prefilled
- [x] The vehicle form opens with focus in its first field, and Escape closes it
- [x] Saving an edit updates the card
- [x] Delete asks for in-page confirmation
- [x] Confirming delete removes the card
- [x] Restock updates the stock shown
- [x] Restock rejects a quantity outside 1–10,000 with the message under the field, sending nothing
- [x] A failed delete or restock shows the API error as a red toast and keeps its panel open
- [x] Save, Add stock and Confirm delete ignore a second click while their request is in flight
