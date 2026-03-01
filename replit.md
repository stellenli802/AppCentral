# AppCentral — Mini-App Platform + Smart Task Router

## Overview
AppCentral is a mini-app platform that hosts real mini-apps on a secure runtime, intelligently routes users to mini-apps or external services via keyword matching, and demonstrates platform extensibility. Mobile-first, dark theme, PWA-enabled.

## Architecture
- **Frontend**: React + Vite + Wouter + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js + Drizzle ORM + PostgreSQL
- **Auth**: Replit Auth (OpenID Connect) via `server/replit_integrations/auth/` — DO NOT MODIFY
- **Mini-apps**: Static HTML files in `client/public/mini-apps/`, loaded in sandboxed iframes
- **SDK**: `/sdk.js` (Nexus SDK v2) — Promise-based Nexus API + MiniApp backward-compat shim
- **Legacy SDK**: `/sdk/v1.js` — Original MiniApp SDK (still supported)
- **Manifests**: Individual `app.json` files in `client/public/manifests/` — source of truth for app metadata
- **Smart Task Router**: Keyword-based routing in `client/src/lib/task-router.ts`
- **Theme**: Always dark mode, mobile-first
- **PWA**: Manifest + apple-mobile-web-app meta tags

## Platform Governance System

### Nexus SDK (`/sdk.js`)
- `Nexus.init()` — Sends READY message to host
- `Nexus.getUser()` — Returns Promise<{authCode, user?, token?}> — triggers WeChat-style identity consent modal
- `Nexus.getLocation()` — Returns Promise<{latitude, longitude}> — triggers consent modal
- `Nexus.showNotification({title, body, data})` — Returns Promise<boolean>
- `Nexus.publishActivity({title, body, icon, data, ttl})` — Pushes live activity card to Home feed
- `Nexus.close()` — Sends CLOSE to host
- `Nexus.on(event, callback)` / `Nexus.off(event, callback)` — Event listeners
- Backward-compatible: also exposes `MiniApp.*` API (requestAuthCode, getLocation, sendNotification)
- Rate limits: 3 auth/30s, 5 location/30s, 10 notifications/30s, 15 activities/30s

### Manifest System
- Individual `app.json` files in `client/public/manifests/{appId}.json`
- Each manifest contains: id, name, description, icon, color, category, entryUrl, permissions (["location", "identity"]), allowedOrigins, version, developer, intents, sdk
- `GET /api/manifests` — Crawl all manifests from the manifests directory
- `GET /api/mini-apps/:id/manifest` — Returns individual manifest (reads from file, falls back to DB)
- Host reads manifests to build UI and enforce security rules

### Permission Guard (Consent Modal)
- Triggered when mini-app calls `Nexus.getLocation()` or `Nexus.getUser()` for first time
- **Auth (identity)**: WeChat-style modal showing user avatar + name + "Allow & Sign In" button + "Allow Once" + "Not Allowed"
- **Location**: Standard modal with "[App Name] is requesting your GPS location" + Allow Once / Always Allow / Deny
- Stored in `app_permissions` table via Drizzle ORM
- Session grants stored in ref (cleared on page reload)
- Host-side rate limiting enforced per message type
- Auth response includes user profile (name, profileImage) + mock JWT token alongside auth code

### Home Screen
- Contextual Island: If active tasks exist, shows Activity Pill (cycling updates every 4s) below search bar; if no active tasks, shows "Resume: [Last App]" pill next to search bar
- Pull-down Recent Apps Tray: Pull down at top of home screen reveals horizontal row of last 5 recently used apps as circle icons (auto-hides after 4s)
- App grids by category (Transportation, Entertainment, Shopping)
- Highlights section: top 2 urgent activity cards + "View All Activity →" link to Activity Center
- Favorites horizontal scroll + External Services section
- State-Aware Recents: MiniAppRunner saves app ID + URL to localStorage on launch; recents tray launches with saved state

### Back Navigation
- All tabs pass `?from=` query param when navigating to mini-app runner (messages, explore, my-apps, profile)
- MiniAppRunner reads `?from=` and navigates back to the referring page on back/close
- Default fallback is "/" (home)

### Activity Center (Messages Tab)
- Header: compact "Activity" title + Select button + MoreHorizontal menu (Read all / Clear all)
- Sub-tabs: "Notifications" (grouped by app) and "Live Activity" (15s polling feed)
- Notifications grouped by miniAppId with app icon headers
- Swipe-left reveals trash button per notification (only rendered when `revealed===true`, 72px red zone)
- Selection mode: "Select" button enters multi-select with checkboxes, bulk "Mark read" / "Delete" actions, Select All/Deselect All, exit via X
- `DELETE /api/notifications` — Clears all user notifications

## Core Features
1. **Mini-App Runtime** — Sandboxed iframes with secure postMessage bridge + rate limiting
2. **Nexus SDK v2** — Promise-based `Nexus.getUser()`, `Nexus.getLocation()`, `Nexus.showNotification()`, `Nexus.publishActivity()` with built-in rate limiting + MiniApp backward compat
3. **Manifest-Based Governance** — Individual app.json files define permissions, intents, and metadata
4. **PostMessage Bridge** — Zod-validated, origin-verified messaging with rate limiting enforcement
5. **Permission Guard** — Consent modal with Allow Once / Always Allow / Deny, DB-backed preferences
6. **Live Activity Feed** — Push-model feed on Home tab, mini-apps publish cards with TTL
7. **Smart Task Router** — Intent-based routing with grouped results (Actions, Mini-Apps, External)
8. **External Service Routing** — Deep link attempt + web fallback (Uber, Yelp, Expedia)
9. **Developer Mode** — Toggle in My Apps settings; shows Add Mini-App, Bridge Inspector, and dev tools
10. **Bridge Inspector** — Logs all bridge messages (type, origin, allowed/blocked, timestamp) — visible only in Dev Mode
11. **Service Notifications** — DB-backed notification center with per-app cards, unread badges

## 9 Real Mini-Apps (all use SDK v1/Nexus)
### Transportation
- **CityMove** (transit.html) — Bus/train/subway arrivals, green (#4CAF50), requests AUTH_CODE + LOCATION via SDK
- **SpotHero** (parking.html) — Parking lots with availability, blue (#1A73E8), requests AUTH_CODE + LOCATION via SDK
- **Travel Hub** (travel.html) — Flight check-in + boarding passes + search, purple (#8B5CF6), requests AUTH_CODE via SDK
### Entertainment
- **StreamFlix** (moviestream.html) — Netflix-like streaming UI with genre rows, hero banner, watchlist, black/red (#000000/#E50914), requests AUTH_CODE via SDK
- **StreamTV** (streamtv.html) — YouTube-like video feed with category chips, trending, red (#FF0000), requests AUTH_CODE via SDK
- **TicketHub** (showtix.html) — Fandango-like ticket booking with showtimes, seat picker, purple (#410099), requests AUTH_CODE + LOCATION via SDK
### Shopping
- **Bullseye Mart** (megamart.html) — Target-like retail with departments, product cards, cart, red (#CC0000), requests AUTH_CODE + LOCATION via SDK
- **PrimeCart** (quickshop.html) — Amazon-like e-commerce with deals carousel, product listings, navy/orange (#232F3E/#FF9900), requests AUTH_CODE via SDK
- **SparkMart** (valuestore.html) — Walmart-like retail with rollback deals, pickup/delivery, blue/yellow (#0071CE/#FFC220), requests AUTH_CODE + LOCATION via SDK

## Screens
1. **Home Hub** (home-tab.tsx) — Greeting, Activity Pill (cycling updates), search bar, mini-app grids by category, Highlights (top 2 urgent activities + View All), favorites, external services
2. **Explore** (explore-tab.tsx) — Category filter, app cards with permissions/version info, platform info
3. **Activity Center** (notifications-tab.tsx) — Notifications grouped by app + Live Activity sub-tab, swipe-to-delete, Clear All, Read All
4. **My Apps** (my-apps-tab.tsx) — Recently used, pinned favorites, all mini-apps grid
5. **Profile** (profile-tab.tsx) — Personal info, payment methods, linked accounts, permissions, security, notification prefs, appearance, dev mode, help, sign out
6. **Search** (search-tab.tsx) — Intent router with grouped sections: Actions, Mini-Apps, External Services (standalone page from home)
7. **Mini-App Runner** (mini-app-runner.tsx) — Iframe with consent modal, action bar, permission chips, bridge inspector (dev mode)
8. **Permissions** (permissions.tsx) — DB-backed per-app toggles for Location and Auth, security info (back → /my-apps)
9. **Add Mini-App** (add-mini-app.tsx) — Developer mode form with intents, manifest preview, HTTPS validation, verified badge

## Key Files
- `shared/schema.ts` — Data models (miniApps, favorites, appPermissions, notifications, activities) + PostMessage Zod schemas
- `server/routes.ts` — API routes with auth middleware + manifest crawl endpoint + activity endpoints
- `server/storage.ts` — DatabaseStorage with Drizzle/PostgreSQL (includes activity CRUD)
- `server/seed.ts` — Seeds 9 real mini-apps + 12 demo notifications + 6 demo activities
- `client/public/sdk.js` — Nexus SDK v2 (Promise-based, rate-limited, backward-compat MiniApp shim)
- `client/public/sdk/v1.js` — Legacy MiniApp SDK v1
- `client/public/manifests/*.json` — Individual app.json manifest files
- `client/src/lib/task-router.ts` — Intent router with actions + mini-app + external result types
- `client/src/components/app-shell.tsx` — 4-tab navigation (Home/Explore/Messages/My Apps)
- `client/src/components/bridge-inspector.tsx` — Bridge message logger (dev mode only)
- `client/src/components/permission-modal.tsx` — Consent modal (Always Allow / Allow Once / Deny)
- `client/src/hooks/use-dev-mode.ts` — Dev mode toggle (localStorage-persisted)
- `client/src/hooks/use-notifications.ts` — Notifications hook with unread count polling
- `client/src/hooks/use-mini-apps.ts` — Shared data hooks
- `client/src/hooks/use-permissions.ts` — DB-backed permissions hook

## DB Tables
- `users` — Replit Auth users
- `mini_apps` — App manifest (id, name, description, icon, color, category, url, permissions, allowedOrigins, intents, version, developer, etc.)
- `favorites` — User favorites (userId, miniAppId)
- `app_permissions` — Per-user per-app permissions (userId, miniAppId, permission, granted)
- `notifications` — Service notifications (userId, miniAppId, title, body, data, isRead)
- `activities` — Live activity feed (miniAppId, title, body, icon, data, expiresAt, createdAt) — TTL-based expiration

## PostMessage Bridge
- Schema: `postMessageSchema` in shared/schema.ts
- Types: AUTH_CODE_REQUEST/RESPONSE, LOCATION_REQUEST/RESPONSE, HOST_ERROR, NOTIFICATION_SEND/ACK, PUBLISH_ACTIVITY/ACTIVITY_ACK, READY, CLOSE
- HOST_ERROR codes: DENIED, NOT_DECLARED, UNAVAILABLE, BROWSER_DENIED, FAILED, RATE_LIMITED
- Origin validated on READY, stored in ref, used as targetOrigin
- Bridge Inspector logs all messages when dev mode enabled

## API Endpoints
- `GET /api/mini-apps` — List all active mini-apps
- `GET /api/mini-apps/:id` — Get single mini-app
- `GET /api/mini-apps/:id/manifest` — Get app manifest (reads from file, falls back to DB)
- `GET /api/manifests` — Crawl all manifest files from manifests directory
- `GET /api/mini-apps/category/:category` — Filter by category
- `GET /api/mini-apps/search/:query` — Search mini-apps
- `POST /api/mini-apps` — Create mini-app (auth required, developer mode)
- `GET /api/favorites` — Get favorite apps (auth required)
- `GET /api/favorites/ids` — Get favorite IDs (auth required)
- `POST /api/favorites/:miniAppId` — Add favorite (auth required)
- `DELETE /api/favorites/:miniAppId` — Remove favorite (auth required)
- `GET /api/permissions` — Get all user permissions (auth required)
- `GET /api/permissions/:miniAppId/:permission` — Check specific permission (auth required)
- `POST /api/permissions` — Set permission { miniAppId, permission, granted } (auth required)
- `GET /api/notifications` — Get all notifications (auth required, seeds demo data on first call)
- `GET /api/notifications/unread-count` — Get unread count (auth required, polled every 30s)
- `POST /api/notifications` — Create notification { miniAppId, title, body, data } (auth required)
- `PATCH /api/notifications/:id/read` — Mark notification as read (auth required)
- `POST /api/notifications/read-all` — Mark all as read (auth required)
- `DELETE /api/notifications/:id` — Delete notification (auth required)
- `GET /api/activities` — Get active (non-expired) activities
- `POST /api/activities` — Create activity { miniAppId, title, body, icon, data, ttl } (public — apps post via bridge)
- `POST /api/auth-code` — Generate auth code for mini-app bridge (auth required)
