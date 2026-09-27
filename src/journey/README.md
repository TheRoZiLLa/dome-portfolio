# Journey transition

The existing Vite/JavaScript Hero is unchanged at rest. This module adds an elastic bottom-boundary interaction and one temporary raw WebGL canvas. No React or rendering framework is required.

`createJourneyTransition(hero, { onComplete })` returns a controller with `state`, `transitionComplete`, and `destroy()`. The app exports its controller as `journeyTransition` from `src/main.js`. Completion also dispatches `journey:complete` on `window`. A future Storytelling component can be mounted from the callback/event; none is mounted now.

The pull uses exponential resistance, a 150 CSS-pixel ceiling and a 75% activation threshold. Wheel input respects delta modes, horizontal gestures, zoom gestures and normal document scrolling. A gesture that arrives at the bottom must pause before a new pull can begin. A sub-threshold gesture springs back. Touch requires an upward drag beginning at the bottom. Arrow Down, Page Down and Space also pull; Tab/Enter provides an accessible text-only Start Journey control.

After activation, the 4.4-second clock runs formation (1.05 seconds), suction, impact and the camera dive. The original Makcasa glyph slots and contained portrait are composited into separate transparent textures at their rendered viewport positions. This is an adapter for the current Hero, not an arbitrary DOM screenshotter: add explicit texture adapters when adding important new Hero layers. Text responds sooner; the portrait has greater inertia. A power-law inverse UV mapping provides inward radial attraction with tangential compression and radial elongation. Dark purple dust, directional RGB separation, radial trails, short tearing bursts and a changing projection build toward the dive.

Reduced motion uses the same navigation with a 350ms fade. WebGL creation/compilation failure also falls back to a fade. Resizing during the cinematic completes via the fade rather than stretching stale viewport textures. The clock pauses when the tab is hidden. The canvas, textures, shaders, buffer and program are disposed at completion; input listeners are aborted. The endpoint contains only the #0E0E0E background.

## Verification

Run `npm run dev`, then open `/tests/journey.html` and press **Run journey checks**. The browser fixture checks idle, wheel pull, release, one-shot completion, reverse-input lock, normal scrolling, momentum gating, touch, reduced motion and resource cleanup. Synthetic touch verifies the handler contract; device-specific touch/trackpad feel still needs physical hardware testing.

For visual inspection in development, `?journeyFrame=2.8` freezes the cinematic at that second after normal activation. Useful values: `.5`, `1.05`, `2.8`, `3.85`, `4.25`. This switch is disabled in production. Reload without the parameter to test the full sequence.

Run `npm run build` for production. The test HTML is not an input to the Vite production build. Performance is bounded by capped 1.5 device pixel ratio, two textures and one fullscreen pass; 60 FPS remains hardware-dependent.
