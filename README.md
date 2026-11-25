# MiraiGo Cross-Platform

MiraiGo Cross-Platform runs on iOS, Android and web from a single Expo
project. The web routes use browser-specific views where the design follows
`miraigo-fe`.

It is built for daily study workflows: clear navigation, low-friction
practice, and a consistent learning experience across supported platforms.

## Product Scope

- Lesson content with video and PDF materials
- Grammar, vocabulary, and kanji study experiences
- AI practice chat with text and voice interaction where supported
- Practice modes for reading, listening, pronunciation, shadowing, and
  flashcards
- JLPT preparation and progress-oriented learning flows
- Light and dark themes with persistent user preferences

[`miraigo-fe`](../miraigo-fe) is the reference for the browser layout,
responsive breakpoints and learning flows.

## Tech Stack

- **React 19.3**
- **React Native 0.88**
- **Expo SDK 58**
- **Expo Router** for file-based navigation
- **Expo Router and React Native Web** for web, with MUI and Tailwind CSS for
  browser-specific views
- **TypeScript** with typed routes enabled
- **React Native Reanimated** for animations

### Mobile demo

Run `npm run start:demo` to open Expo Go with sample courses, progress, vocabulary, exams, and speaking sessions. Demo mode is available in development on mobile and keeps its data separate from backend accounts. AI responses and speech scores are simulated in this mode. Use `npm start` for the backend-connected app when `EXPO_PUBLIC_DEMO_MODE` is unset or false.

## Supported Platforms

- iOS
- Android
- Web through Expo and Metro

### Learner navigation

The five tabs are Trang chủ, Khóa học, Luyện tập, Tiến độ, and Cá nhân.
Open Bảng chữ and Hán tự from Từ vựng, or open Cài đặt from Cá nhân.

On iOS, `expo-router/native-tabs` renders the system tab bar. iOS 26 and later
provide native Liquid Glass and its touch interactions. Earlier iOS versions
use the system's standard tab bar. Android uses a custom bar. The browser
uses a sidebar on desktop and a drawer on narrow screens.
The iOS tab bar intentionally keeps the system material, without an opaque
background or a custom gesture layer covering it.

Learner screens share a Liquid Glass design system for filters and actions on
supported iOS devices, with themed controls on other platforms. See the
[rollout plan and device checklist](./docs/liquid-glass-rollout.md).

## Getting Started

### Prerequisites

- Node.js and npm
- An iOS simulator, Android emulator, physical device, or a web browser
- Expo Go or an Expo development build for device testing

### Install dependencies

```bash
npm install
```

### Configure the backend

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL` to the
reachable URL of `miraigo-be`. For a physical device, `localhost` points to
the device itself; use the development machine's LAN IP instead.

Set `EXPO_PUBLIC_FE_BASE_URL` to the trusted `miraigo-fe` origin used for
tools that open inside the mobile app. These tools use a separate web session.
Set `EXPO_PUBLIC_VOICE_API_URL` to the Voice AI service for native
pronunciation, shadowing and transcription. See the
[feature coverage and configuration](./docs/fe-feature-parity.md).

Set `EXPO_PUBLIC_AI_BASE_URL` to the MiraiGo Japanese AI Platform to use it for
native speech features instead of the legacy voice service. Pronunciation and
shadowing then show a 0-100 score with per-word feedback, and file or voice
transcription uses the platform's speech-to-text. The platform authenticates
with the same access token as the backend, so the app must be signed in. Leave
it empty to keep the legacy `EXPO_PUBLIC_VOICE_API_URL` behaviour. Platform
limits apply: recordings up to 120 s (30 s for pronunciation) and 25 MB.

### Start the Expo app

```bash
npm start
```

Open the Expo Go QR code or use one of the platform-specific commands.

```bash
npm run ios
npm run android
```

### Start MiraiGo Web

Run the Expo web target from `miraigo-x-p`.

```bash
npm run web
```

Open [localhost:3001](http://localhost:3001). The web API base URL defaults to
`EXPO_PUBLIC_API_BASE_URL`. Set `EXPO_PUBLIC_WEB_API_BASE_URL` to use a
different address in the browser. Add the Expo web origin to the backend's
`CORS_ALLOWED_ORIGINS`. To receive verification links that open Expo web,
set the backend's public web URL to the same origin.

For local development with the backend listening on the same machine:

```bash
EXPO_PUBLIC_WEB_API_BASE_URL=http://localhost:8080 npm run web
```

Build the web project with `npm run web:build`. See the
[web migration plan](./docs/web-integration.md) for route coverage.

### Run Expo in Docker

If you have not configured `.env` yet, copy `.env.example` to `.env` and replace
`192.168.1.10` with your computer's Wi-Fi IPv4 address, then run:

```bash
docker-compose up --build
```

The Expo Go QR code and the backend URL must use an address reachable from the
phone. The container publishes Metro on port `8081`.

### Lint the project

```bash
npm run lint
```

## Backend Integration

The first learner screens use React Query and the Spring Boot API:

- Login: `POST /api/v1/auth/authenticate`
- Registration: `POST /api/v1/auth/register`, followed by email verification
- Email verification: `POST /api/v1/auth/verification/confirm` and `/resend`
- Home: course summary from `GET /api/v1/courses?tree=true`
- Courses: course tree from `GET /api/v1/courses?tree=true`
- Practice: published JLPT exams from `GET /api/v1/jlpt/exams`
- Vocabulary: courses and review statistics from `/api/v1/vocab/*`
- Grammar: grammar books from `GET /api/v1/grammar-books`
- Kanji: local roadmap fallback until a kanji endpoint is available in the backend

Every connected screen keeps starter content available when the backend is
unreachable, and displays a connection state instead of failing the whole app.
Authentication keeps the access token in Expo SecureStore. The API payloads and
email-verification rules match the web client; cookie refresh is handled through
the native fetch credential store and may depend on platform cookie behavior.

## Architecture Principles

- Organize code by feature rather than by technical type alone
- Keep platform-specific code at the edges of the application
- Share domain models, business rules, and API contracts across platforms
- Separate server state, local UI state, and persisted user preferences
- Use platform-appropriate and accessible interactions
- Reuse MiraiGo product terminology and learning rules from the web client

## Project Structure

```text
src/
  app/                # Expo Router routes and top-level navigation
  components/         # Reusable React Native and platform-specific components
  constants/          # Theme and application constants
  hooks/              # Shared React hooks
  features/           # Domain features such as practice, vocabulary, and kanji
  integrations/       # API, authentication, storage, and device capabilities
```

Expo Router currently uses `src/app` for file-based routes. Shared feature and
integration modules should be added under `src/` as the application grows.

## Relationship to the Frontend

Expo web builds the browser views in `src/features/web`. Routes ending in
`.web.tsx` select those views. Expo web and native share the Spring Boot
client, authentication storage interface, course data service, grammar
catalog and last-lesson tracking. FE-only learning tools are tracked in the
[feature parity checklist](./docs/fe-feature-parity.md).

## Development Status

The project includes the learner home, backend-connected learning
screens, and the first native authentication flows (login, registration, and
email verification). Additional account-management screens remain to be built.

## Brand

This application is branded as **MiraiGo** across UI copy, navigation, and
learner-facing experiences.
