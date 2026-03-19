# SwipeMart 🛍️

A Tinder-style product discovery app built with **React Native + Expo**.  
Swipe right to save items to your watchlist, swipe left to skip.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native (Expo SDK 55) |
| Routing | Expo Router (file-based, like Next.js App Router) |
| Auth + DB | Supabase |
| Animations | React Native Animated + PanResponder |
| Location | expo-location |
| Local storage | AsyncStorage (guest mode) |
| Product APIs | DummyJSON (pluggable) |

---

## Project Structure

```
app/
  _layout.js            Root layout – providers + auth guard
  auth.js               Sign in / create account screen
  (tabs)/
    _layout.js          Tab bar
    index.js            🔍 Discover (swipe deck)
    watchlist.js        ♥  Watchlist
    profile.js          👤 Profile + settings

components/
  SwipeDeck.js          Core Tinder-style swipe deck
  ProductCard.js        Product card + detail modal
  SearchModal.js        Keyword + category search sheet

context/
  AppContext.js         Auth, location, search state

hooks/
  useProducts.js        Paginated product fetching
  useWatchlist.js       Watchlist CRUD (Supabase or AsyncStorage)

services/
  supabase.js           Supabase client + auth/db helpers
  api/
    index.js            Aggregator – fan queries to all sources
    dummyJsonApi.js     DummyJSON adapter (free, no key required)

constants/
  colors.js             Design tokens

supabase/
  schema.sql            Database schema to paste into Supabase SQL Editor
```

---

## Deploying to the Web (Netlify / Vercel / GitHub Pages)

Expo can compile to a static web bundle via React Native Web. The output is a regular
static site you can host anywhere for free.

### Netlify (recommended, zero-config)

1. Push the repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build:web`
   - **Publish directory:** `dist`
4. Add environment variables in **Site → Site configuration → Environment variables**:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** — done.

### Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Override the build settings:
   - **Build command:** `npm run build:web`
   - **Output directory:** `dist`
4. Add the same two env vars under **Settings → Environment Variables**

### Manual / local export

```bash
npm run build:web   # outputs to dist/
```

Then drag the `dist/` folder into Netlify's dashboard manually.

> **Web limitations vs native app:**
> - Location uses the browser's Geolocation API (requires HTTPS — Netlify provides this automatically)
> - Push notifications are not available on web
> - The swipe gestures work in desktop browsers and mobile browsers

---

## Native App Distribution (free tier)

To distribute as a real installable app, use **EAS Build** (Expo's build service):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview  # produces a shareable .apk
```

Free tier: 30 builds/month. No Apple/Google developer account needed to share via QR code or direct APK download.

---

## Getting Started

### 1 – Prerequisites

- Node.js ≥ 20.19.4  
- Expo Go app on your phone, **or** Android/iOS simulator

### 2 – Clone & install

```bash
git clone <your-repo>
cd craigs-app
npm install
```

### 3 – Set up Supabase (free)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine)
2. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it
3. Copy your project URL and anon key from **Project Settings → API**
4. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Guest mode**: If you skip Supabase, the app still works using local AsyncStorage – you just won't get cross-device sync.

### 4 – Run

```bash
npx expo start
```

Scan the QR code in Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Adding More Product Sources

The API layer (`services/api/index.js`) fans queries out to all configured sources.  
To add a new one (e.g. eBay, Etsy, Best Buy):

1. Create `services/api/mySourceApi.js` that exports:
   - `searchProducts(query, { limit, skip })` → `{ products, total }`
   - `browseProducts({ limit, skip })` → `{ products, total }`
   - Normalize response to the internal product shape (see `dummyJsonApi.js`)
2. Import it in `services/api/index.js` and add it to the `SOURCES` array

### Free APIs worth adding

| Source | Docs | Auth |
|---|---|---|
| Best Buy | https://bestbuyapis.github.io/api-documentation/ | Free API key |
| Etsy | https://developers.etsy.com | Free OAuth |
| eBay Browse | https://developer.ebay.com/api-docs/buy/browse/overview.html | Free OAuth |

---

## Supabase Database Schema

Two tables are created by `supabase/schema.sql`:

- **`profiles`** – user profile (auto-created on signup)
- **`watchlist`** – saved products (`user_id`, `product_id`, `product_data` JSONB, `source`)

Row Level Security is enabled on both tables so users can only access their own data.

---

## Roadmap / Next Steps

- [ ] Product detail page with full image gallery
- [ ] Price alert notifications
- [ ] Share watchlist items
- [ ] Filter by price range and rating
- [ ] Push to production eBay / Etsy APIs
- [ ] "For you" recommendations based on swipe history
