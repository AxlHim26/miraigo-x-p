# MiraiGo Cross-Platform

MiraiGo Cross-Platform is the learner-facing application for bringing the
MiraiGo Japanese learning experience to mobile and web platforms from a shared
React Native codebase.

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

The web frontend in [`miraigo-fe`](../miraigo-fe) is the reference
implementation for learner-facing product behavior and terminology.

## Tech Stack

- **React 19.3**
- **React Native 0.88**
- **Expo SDK 58**
- **Expo Router** for file-based navigation
- **React Native Web** for web support
- **TypeScript** with typed routes enabled
- **React Native Reanimated** for animations

## Supported Platforms

- iOS
- Android
- Web through Expo for Web

## Getting Started

### Prerequisites

- Node.js and npm
- An iOS simulator, Android emulator, physical device, or a web browser
- Expo Go or an Expo development build for device testing

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

From the Expo CLI, choose a target platform or use one of the platform-specific
commands:

```bash
npm run ios
npm run android
npm run web
```

### Lint the project

```bash
npm run lint
```

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

`miraigo-fe` is the reference web implementation. This project should reuse
its product concepts and backend contracts while adapting navigation, layout,
and device-specific interactions to React Native and Expo.

When behavior changes, update the shared contract and reflect the change in
both the web and cross-platform clients where applicable.

## Development Status

The project is currently based on the Expo starter scaffold. Product features,
shared API integrations, authentication, and learning workflows will be added
incrementally.

## Brand

This application is branded as **MiraiGo** across UI copy, navigation, and
learner-facing experiences.
