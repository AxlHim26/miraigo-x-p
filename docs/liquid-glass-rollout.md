# Learner Liquid Glass rollout

## Scope and order

1. Establish shared learner materials, typography, backdrops and controls. Keep the iOS system tab bar in charge of tab gestures.
2. Apply the system to Trang chủ, then to the shared learning screen used by Khóa học, Luyện tập, Từ vựng, Ngữ pháp and Hán tự.
3. Apply it to Tài khoản and Cài đặt. Keep existing URLs, queries, logout and unavailable feature boundaries. Authentication screens are outside this learner UI pass.
4. Validate layout and navigation on web and export each platform. Verify native material, tap feedback and scroll insets in Expo Go on iOS 26/27, plus fallback appearance on an Android device.

## UI rules

- Reserve system Liquid Glass for controls over content. Give reading surfaces a steady fill and use decorative color behind highlights to create depth.
- Use the existing Expo SDK dependency and check both compiled and runtime glass availability. Android, web, and older iOS use an opaque, themed control with a visible press state.
- Design for light and dark modes, wrapping labels, minimum 44-point control targets, and selected/disabled states. Native effects respect system accessibility appearance.
- Keep suggested content distinguishable from real progress. Where a lesson or assessment is not yet implemented, surface the available list rather than adding a button that implies a working lesson.

## MiraiGo web reference

- The learner canvas and surfaces follow the tokens in `miraigo-fe/src/app/globals.css`. The mobile home adapts the web landing hero and its colored feature cards.
- Courses use a responsive catalog grid. Grammar uses a level list. Vocabulary starts with a library banner. Kanji uses numbered roadmap cards. Practice adopts the navy JLPT Dojo banner and a grid for the available exams.
- The iOS native tab bar stays in place. The desktop sidebar, web-only Kanji graph and routes for lessons or exam attempts are outside this visual pass.

## Acceptance

- Both themes preserve readable text and visible controls; the header still has only the centered brand.
- Learning shortcuts, Cài đặt and logout still work. Loading, empty and error states do not masquerade as real user progress.
- TypeScript, lint and iOS/Android/web exports pass. Device acceptance remains separate from bundle verification.
