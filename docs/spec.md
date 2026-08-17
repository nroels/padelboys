# Padelboys — Build Spec

Design source of truth: the interactive mock at https://claude.ai/code/artifact/7de80e16-d1ec-4fe0-92d3-8cc467b0e136 (retro pixel-art PWA, mobile-first, 420px column). All screens, flows, copy and styling are defined there. This spec captures the functionality and decisions behind it.

## Glossary

- **Player** — one of 6 fixed friends. No accounts; identity is picked once per device.
- **Game night** — a planned play session: date + time. The core entity; everything links to it.
- **Set** — one match within a game night: 2v2 teams + a set score (e.g. 6-3).
- **Schedule** — the generated rotation for a game night: 3 sets, each a different team split of the 4 joined players.
- **Pending night** — a game night whose date has passed but that has no finished score log yet.
- **ELO** — per-player rating, updated per set.
- **Duo** — a pair of players who played sets together as a team.

## Problem Statement

Six friends play padel together regularly. They plan nights over chat, rotate teams three times per night by gut feeling, and lose track of scores entirely. Nobody knows who's actually winning, which duo works, or when the next game is — and planning a night two weeks ahead is scattered across group-chat messages.

## Solution

A small mobile web app (PWA) for exactly these 6 players. Anyone plans a game night (day + time, up to 2 weeks ahead); the others join until 4 spots are full. One shuffle deals a fair 3-set rotation schedule for the night. Afterwards, one person logs the set scores through a wizard prefilled from the schedule. The app keeps an ELO ranking, head-to-head rivalries, best duos and streaks — with a retro arcade personality that makes checking the ranking fun.

## User Stories

1. As a player, I want to open the app and immediately see the next game night with date, time and who's in, so that I know when I'm playing next.
2. As a player, I want to plan a game night by picking a day (up to 2 weeks ahead) and a time slot, so that we stop planning over chat.
3. As a player, I want the other 5 to be notified when a night is planned, so that spots fill up without me chasing people.
4. As a player, I want to join or leave an upcoming night with one tap, so that committing is trivial.
5. As a player, I want a night to be capped at 4 players and marked FULL, so that the rotation always works and joining is first-come-first-served.
6. As a joined player, I want to shuffle the night once we're with 4, so that the app deals the full 3-set schedule (3 different team splits) instead of us arguing about teams.
7. As a player, I want each scheduled set to show a fairness percentage based on ELO, so that we can see the teams are balanced.
8. As a player, I want anyone to be able to reshuffle until the first score is logged, so that the schedule stays a shared thing, not one person's choice.
9. As a player, I want the schedule to reset when someone joins or leaves, so that it never references a player who isn't coming.
10. As a player, I want the shuffle to feel like a slot machine rolling through our avatars, so that dealing teams is a moment, not a form.
11. As the night's scorekeeper, I want to open a pending night in the log tab and walk through a wizard, so that logging 3 sets takes under a minute.
12. As the scorekeeper, I want each set's teams prefilled from the schedule, so that I only enter the score.
13. As the scorekeeper, I want to tap avatars to change teams for a set, so that I can log what we actually played when we deviated.
14. As the scorekeeper, I want to log fewer or more than 3 sets, so that short nights and bonus sets are both possible.
15. As the scorekeeper, I want to enter a set score as two numbers (0–7) with a required winner, so that entry is fast and unambiguous.
16. As the scorekeeper, I want to delete a wrongly logged set of the most recent night and re-enter it, so that mistakes don't poison the stats.
17. As the scorekeeper, I want to finish the night explicitly, so that it moves to history and ratings update at a clear moment.
18. As a player, I want an ELO ranking of all 6 with W–L records and rating deltas, so that there's a leaderboard to trash-talk about.
19. As a player, I want ELO to handle unequal play frequency naturally, so that someone who plays less isn't unfairly ranked.
20. As a player, I want win/loss streaks shown on the ranking and in stats, so that hot and cold runs are visible.
21. As a player, I want a head-to-head rivalry view where I pick any 2 players, so that I can settle who owns whom.
22. As a player, I want a best-duo ranking (win% per pair, minimum 3 sets together), so that we know which team-up actually works.
23. As a player, I want history grouped per game night with all its sets, so that I can relive a night at a glance.
24. As a player, I want to pick who I am from the 6 on first open, remembered on this device, so that I never log in.
25. As a player, I want to switch player from the account screen, so that a shared or new device isn't a problem.
26. As a player, I want to set my username (max 6 chars) and upload a photo that gets pixelated into a 16×16 avatar, so that my identity fits the arcade style.
27. As a player, I want a one-time hint explaining how to add the app to my home screen, so that I get the full-screen app and push notifications.
28. As a player, I want push notifications for a newly planned night and a reminder on the morning of a game day, so that I never miss a night.
29. As a player, I want to toggle notifications off in account, so that I control the noise.
30. As a player, I want a delightful splash screen (press start, bouncing ball, starfield) and a live ticker with streaks and the next game, so that opening the app feels like our arcade, not a spreadsheet.
31. As a player, I want the app to work correctly on my phone as an installed PWA, so that it feels like a native app.

## Implementation Decisions

- **Stack**: simple React app (Vite + React, no meta-framework) as a static PWA + Supabase (Postgres, Realtime, Edge Functions for push). Keep the implementation deliberately simple — this is a 6-person hobby app, not a product.
- **Hosting**: static host with git-based deploys and preview URLs (Vercel or Netlify free tier). Every push deploys; main = production URL that the friends install.
- **No auth, but locked-down rows**: the 6 players are seed data; device identity = chosen player id in localStorage. Trust model is "6 friends" — no protection against impersonation between them, but the database must not be open to the internet: RLS enabled on every table, anon key can only touch this app's tables with policies limited to the expected operations (read roster/nights/sets, insert/delete own-shaped rows, no arbitrary updates or deletes outside the rules). Cap-of-4 and score-validation rules enforced in Postgres (constraints/policies), not only in the UI.
- **Domain model**: `players` (fixed 6: name, avatar), `game_nights` (datetime, status: upcoming/pending/finished), `night_players` (join table, max 4 enforced), `sets` (night id, set index, team A pair, team B pair, score A, score B), schedule stored on the night (3 ordered team splits).
- **Single domain module** (the seam, see below): pure functions for schedule generation (3 unique splits of 4, shuffled), fairness % (ELO-sum difference), ELO update per set (team rating = average; standard expected-score formula; K to be tuned, start K=32), ranking/streak/duo/head-to-head derivation from the set log. All stats are **derived from sets**, never stored denormalized — ratings are recomputed by replaying the log, which makes delete+relog trivially correct.
- **Rules enforced**: join cap 4 (FULL); schedule requires exactly 4 joined; any player can reshuffle until the night has ≥1 set logged, then locked; roster change resets the schedule; set score 0–7 per side, equal scores rejected; flexible set count per night (≥1); finishing a night is explicit and moves it to history; sets deletable only on the most recent finished/pending night.
- **Pending nights**: a night whose datetime has passed and isn't finished appears in the log (+) tab; fully finished nights disappear from there.
- **Avatars**: photo upload, client-side crop-to-square and downscale to 16×16 via canvas, stored as small data/blob in Supabase, rendered with `image-rendering: pixelated` and the mock's pixel frame. The mock's SVG pixel avatars are the fallback for players without a photo.
- **Notifications**: Web Push via service worker (works on iOS ≥16.4 when installed on home screen). Events: night planned, reminder on the morning of a game day. Sent from a Supabase Edge Function (planned → on insert; reminder → scheduled function). Per-device subscription; toggle in account. No e-mail.
- **PWA**: manifest + service worker (offline shell caching is nice-to-have, not required); the add-to-home-screen hint overlay shows once (localStorage flag).
- **Realtime**: joins, schedule and logged sets sync live between devices (Supabase Realtime); last shuffle wins.
- **No seasons, no admin role, no court/location field.**

## Testing Decisions

- **Minimal by choice.** One small vitest suite on the domain module only: schedule generation (3 unique splits, only joined players), ELO replay determinism (same log → same ratings; delete+relog equivalence), duo threshold, score validation. That's it.
- No e2e suite, no UI tests — flows are verified by hand on the deployed preview URL. Good tests assert external behavior of the domain module, never DOM or Supabase plumbing.
- Greenfield repo — this small suite is the house style.

## Development Workflow

- **Local first**: `npm run dev` (Vite) covers 95% of work in a desktop browser. Use Safari/Chrome responsive mode with an iPhone viewport; the app is a single 420px column, so desktop dev is representative.
- **On-phone checks without deploying**: Vite dev server with `--host` on the home network → open `http://<mac-ip>:5173` on the iPhone. For testing PWA install/push (needs HTTPS): a quick tunnel (`cloudflared`/`ngrok`) or just push a branch and use the host's preview URL.
- **Deploys are automatic**: push to a branch → preview URL; merge to main → production. Never a manual deploy step.
- **iOS debugging**: Safari on Mac → Develop menu → attached iPhone gives full devtools on the installed PWA.

## Device Compatibility

- Target: iPhones on a reasonably current iOS. Hard floor iOS 16.4 (first version with web push for installed PWAs); everything except notifications should also work below that.
- Layout is a fluid single column (already max-420px in the mock) — no fixed device assumptions; respect `safe-area-inset` for notch/home-indicator, test smallest (SE) and largest viewports in responsive mode.
- Plain CSS/JS features only (the mock already is); no dependencies that require bleeding-edge Safari.

## Out of Scope

- Real court booking / club-calendar integration (a location field doesn't even exist).
- More than 4 players per night (sit-out rotation), multiple courts, point-by-point scoring.
- Seasons/ELO resets, season winners.
- Authentication, e-mail notifications, roster management UI (players are seeded).
- Any visual redesign — the mock is the design contract.

## Further Notes

- The mock contains the exact copy, layout, animations (slot-machine shuffle, bouncing ball, starfield confined to the 420px column) and empty states; treat it as the acceptance reference for UI work.
- Fairness % formula in the mock (`max(60, 100 − eloDiff/4)`) is placeholder-tuned for the mock's ratings; keep the shape, tune constants with real data.
- ELO K-factor and starting rating (mock uses ~1000–1200 range) are tunable constants in the domain module.
