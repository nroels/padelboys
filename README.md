# Padelboys

Retro pixel-art PWA for 6 friends to plan padel nights, shuffle fair team rotations, and log set scores. ELO ranking, rivalries, best duos, streaks.

- **Spec**: [docs/spec.md](docs/spec.md) — user stories, domain model, all decisions
- **Design contract**: [docs/design-mock.html](docs/design-mock.html) — open in a browser; every screen, flow, copy and animation is defined there

## Stack

Vite + React static PWA · Supabase (Postgres + RLS, Realtime, Edge Functions for web push) · deployed via git-based host with preview URLs.

## Development

```
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

On-phone check without deploying: `npm run dev -- --host` and open `http://<mac-ip>:5173` on the iPhone (same wifi network). PWA install/push need HTTPS — use a preview deploy URL for that.

## Status

App shell (splash, header/ticker, 5-tab nav, empty views, PWA manifest + icons) is in place. Player identity (#3) is done: Supabase-backed roster with RLS, onboarding (add-to-home-screen hint + WHO ARE YOU picker), device identity, username edit, switch player. Feature tickets (#4–#9) build the remaining screens on top of it.
