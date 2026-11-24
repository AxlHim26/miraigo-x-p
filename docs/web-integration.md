# MiraiGo Expo Web migration

Web, iOS and Android are built from `miraigo-x-p` with Expo. The browser
layout follows `miraigo-fe` and uses React DOM views for migrated screens.
Expo Router resolves `.web.tsx` route variants and the native routes use
their existing React Native views.

| Scope | Implementation |
| --- | --- |
| Public landing page | FE layout, hero, Kanji rain, feature grid, pricing and footer |
| Authentication | FE views for login, registration, check-email and verification. Requests and credentials use the shared Expo auth service and storage interface |
| Learner navigation | FE logo, desktop sidebar, mobile browser drawer, theme switch, logout and grammar search. Links use available Expo routes |
| Courses | FE list, chapter, section and lesson views with the Spring Boot course tree, video and PDF. Last-lesson tracking is shared |
| Grammar | FE overview and level detail, using the Expo grammar catalog also used by native |
| Kanji | FE roadmap at `/kanji-map`, populated from the shared Expo catalog. Level grids, search and details still use the existing Expo views |
| Vocabulary and practice | Existing Expo screens inside the web shell. FE feature and visual parity are pending |

## Remaining work

1. Port Vocabulary. Migrate the library and community API with account
   ownership, then port set list, set detail, editing and review.
2. Port the Kanji level grid, graph, writing practice and review. Bring over
   the full lookup data and browser routes used by the FE.
3. Port JLPT and practice. Reuse the existing Spring Boot exam APIs and move
   FE-only AI and voice endpoints to Expo server routes or Spring Boot.
   Keep service credentials on the server.
4. Match navigation and desktop layouts at the final URLs. Compare light
   and dark themes against the FE at desktop and phone widths and run the
   full login, verification, logout and learning flows against a test backend.

## Local verification

- Run Expo web on `http://localhost:3001` and run the reference FE on
  `http://localhost:3000` for side-by-side comparison.
- Set `EXPO_PUBLIC_WEB_API_BASE_URL=http://localhost:8080` and include
  `http://localhost:3001` in the backend CORS allowlist. To test email
  verification here, set the backend's `NEXT_PUBLIC_APP_URL` (or
  `EMAIL_VERIFICATION_WEB_BASE_URL` when the former is unset) to the Expo
  web URL and restart the backend.
- Run `npm run typecheck` and `npm run web:build`. Open Expo Go separately
  on iOS and Android to verify native navigation and login.
