# Captain Aura

**Know how to show up.**

A context-aware personal appearance advisor for men. You tell it what you're
doing — in your own words — and it combines your profile, your build, your
style, your wardrobe, your past feedback, the activity, the people, the date
and the live forecast into one specific recommendation, with the reasoning
shown.

It is deliberately **not** a chatbot, a store, or a style quiz. The input box is
just the interface; the product is the structured context underneath it.

```bash
npm install && npm run dev
```

Then open http://localhost:3000 and press **See a demo**. No account, no API
keys, no configuration.

---

## How it works

```
prompt ──▶ context parser ──▶ situation (activity, social, date, formality, goals)
                                   │
profile + wardrobe + memory ───────┼──▶ AuraContext ──▶ RecommendationProvider
                                   │                         │
location ──▶ geocode ──▶ weather ──┘                    rules │ AI
                                                             ▼
                                              structured recommendation UI
                                                             │
                                                        feedback
                                                             │
                                                    Aura Memory (learns)
```

### The context parser (`lib/context/`)

Turns free text into a `Situation`: activity, social context, resolved date,
part of day, formality on a 1–5 scale, goals, concerns, described weather,
location hint and duration — plus an explicit list of what it *couldn't*
determine, which drives at most one follow-up question.

Dates resolve against the real clock (`chrono-node`), so "Friday" means the
upcoming Friday and "for 10 days" is a trip length rather than a date.

### The recommendation engine (`lib/engine/`)

`RuleBasedRecommendationProvider` is deterministic and needs no network. It
builds an outfit blueprint from the activity, target formality and real
conditions, then scores every item you own against each slot — formality
proximity, weather suitability, colour, style and material — and prefers what
you already have. Anything you've said you dislike is a hard exclusion.

Every sentence it emits traces back to a real input; when it doesn't know
something it says so under "What I didn't know" rather than inventing it.

### Memory (`lib/engine/memory.ts`)

Onboarding answers and feedback become typed preference entries. "Too formal"
becomes a formality bias; a worn outfit reinforces its pieces. Only preference
signal is retained — never raw messages — and every entry is visible, editable
and deletable at `/aura`.

---

## Providers

Each external capability sits behind an interface so it can be swapped without
touching the UI (`lib/providers/`):

| Interface | Live implementation | Fallback |
|---|---|---|
| `WeatherProvider` | Open-Meteo (free, keyless) | deterministic mock, labelled as simulated |
| `GeocodeProvider` | Open-Meteo geocoding (keyless) | built-in city list |
| `RecommendationProvider` | Anthropic, if a key is set | rules engine (always) |
| `AppearanceVisionProvider` | Anthropic vision, if a key is set | on-device colour detection + user confirmation |

All external calls happen in route handlers under `app/api/`. No key is ever
referenced in client code.

## Environment

Every variable is optional — see `.env.example`. With no `.env.local` the app
runs fully: rule-based recommendations plus live keyless weather.

## Accounts and sync (Firebase)

The app works fully with **no account** — everything saves to the device via
`lib/store/aura.ts`. Adding Firebase turns that into a real signup so anyone
can use it from any device.

Sign-up, sign-in, Google sign-in and password reset live in `lib/store/auth.ts`;
`components/auth/sync-provider.tsx` reconciles device state with the account:

- Signing in on a fresh device **pulls** the account down.
- Signing up after trying the app **pushes** local work up, so nothing is lost.
- After that, changes are written back on a 1.2s debounce.

Closet **photos never sync** — they're data URLs and a Firestore document is
capped at 1 MB, so photos stay on the device and only the attributes the engine
reads are stored. `firestore.rules` restricts every document to its owner.

### Turning it on

```bash
npx firebase-tools login
npx firebase-tools projects:create captain-aura-app
npx firebase-tools deploy --only firestore:rules
```

Then enable **Email/Password** (and optionally **Google**) under Authentication
in the Firebase console, copy the web app config into `.env.local` as the
`NEXT_PUBLIC_FIREBASE_*` values from `.env.example`, and restart the dev server.
Sign-in appears automatically once those are set.

To publish a shareable URL:

```bash
npx firebase-tools deploy
```

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (typechecks)
npm run start   # serve the build
npm run lint    # eslint
```
