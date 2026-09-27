# Dome — opening experience

A scroll-controlled Three.js cinematic with a 12-second internal timeline. Wheel down advances the journey; wheel up reverses it until the final handoff. Touch swipes, arrow keys, Page Up/Down and Space are also supported. The sequence holds its position when input stops. The final camera move passes through the O in **THIS IS MY JOURNEY.** and reveals an empty `#0E0E0E` page. There is deliberately no Main Page design, navigation, button, loading screen, or other visible UI.

## Run

```sh
npm install
npm run dev
npm run build
npm test
```

The development preview runs at http://localhost:5173. Reload to restart, then scroll to progress. Escape ends the sequence without adding a visible control.

## Structure

- `src/opening/Opening.ts` — modular lifecycle, perspective camera, render target, scene choreography and handoff.
- `src/opening/Artifact.ts` — procedural folded shell, internal rings, instanced ribs and fragmentation.
- `src/opening/Typography.ts` — system-font signed-distance-field typography on subdivided WebGL geometry; responsive line wrapping.
- `src/opening/shaders.ts` — text displacement, animated optical impact, radial blur, depth-based softness and aperture.
- `src/opening/timeline.ts` — exact sentences, timing and optional audio cue metadata.

## Integration later

```ts
import { createOpening } from './opening/Opening';

const opening = createOpening({
  enabled: true,
  mode: 'scroll', // use 'autoplay' for timed playback
  mainPage: document.querySelector<HTMLElement>('[data-main-page]') ?? undefined,
  onCue: cue => { /* connect your own licensed audio later */ },
  onHandoff: progress => { /* optional future hero synchronization */ },
  onComplete: () => { /* page is now available */ },
});

// Component unmount, route changes, or manual cancellation:
opening.destroy();
```

Render the existing page behind the opening normally. Its design is untouched. The optional page root becomes inert during playback; its previous state is restored afterward. The final aperture reveals that real page, without capturing it as an image or fading the whole overlay. A future WebGL Hero can coordinate its own camera through `onHandoff`; no shared Hero camera exists in this blank-page version.

`enabled: false` bypasses the opening. `prefers-reduced-motion: reduce` bypasses it automatically, including a preference change during playback. A grayscale 3D star field and a faint tilted dust band add depth without replacing the `#0E0E0E` base. Moving key, rim and spot lights reveal the artifact surfaces. Both star layers vanish during the silence and final statement.

WebGL failure or context loss shows the final sentence statically for 1.4 seconds, then hands off. No audio plays automatically. Hidden tabs pause the timeline. GPU resources, animation frames and event listeners are released on completion or destruction.

## Visual inspection and checks

Development only: append `?inspect=2.15` (or any second from 0 to 12) to freeze a frame. The controller is exposed as `window.__opening` only in development. Production defaults to scroll control.

Suggested inspection times: `0`, `.65`, `2.15`, `3.1`, `4.6`, `5.5`, `6.4`, `7.5`, `7.98`, `8.35`, `8.8`, `9.7`, `10.7`, `11.86`, `12`.

`npm test` verifies sentence content, timing, scroll normalization, bounded input and smooth forward/reverse settling. The development-only browser fixture at `/tests/lifecycle.html?mode=reduced` verifies completion and restoration of an existing page. Other modes: `disabled`, `fallback`, `destroy`, `context-loss`. These fixtures are excluded from the production build. Browser verification covered desktop and 390px portrait layouts, shader diagnostics, reduced motion, WebGL fallback and lifecycle cleanup.

Rendering uses capped device pixel ratio (1.65), instanced small fragments and ribs, shared geometry/materials within artifacts, and one post-processing pass. A 60 FPS target is an optimization goal, not a hardware-independent guarantee. Text uses local system fonts; there are no runtime CDN, model, texture, font or audio requests.
