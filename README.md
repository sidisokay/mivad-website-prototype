# MI-VAD — motion prototype

A faithful, motion-focused prototype of the MI-VAD landing page (Figma: *MI-VAD — Website*),
built to show the client how the site **scroll-jacks and transitions**. Visuals are kept
identical to the design — this is about the *feel* of the motion, calm and soothing.

## How to view
- **Quickest:** double-click `index.html` (opens in your browser).
- **Or run a tiny server** (better for fonts/caching):
  ```bash
  cd prototype
  python3 -m http.server 5191
  # then open http://localhost:5191
  ```

## The experience (top → bottom)
1. **Intro** — full-bleed green field, *"beautifully small"*. The field drifts slowly (calm "video").
2. **Product scroll-jack** — the device **locks dead-center** while you scroll; only the
   surrounding copy cross-fades through three states:
   - *Less device, more freedom.*
   - *Introducing the world's smallest VAD*
   - *Mi-VAD 2.0 · beautifully small*
   The green behind the device pans gently (the "calm moving video" from the dev note).
   Small dots on the right track which state you're on.
3. **Hero** — the device settles into the destination hero: nav, *"your heart is amazing…"*,
   spec tags (≈18mm · fully implantable · ≈12.7g), trusted-by logos, and CTAs.
4. **Closing** — the framed video card.

## Notes for the client conversation
- **Scroll feel:** uses a *pinned section* + damped (eased) scroll progress — no aggressive
  wheel-hijacking — so it stays smooth on trackpad, mouse and touch, and feels calm.
- **Green areas = video placeholders.** Per the dev notes, the green field and the green
  behind the device are meant to be a calm looping video. Here they're the design stills with
  a slow pan/zoom standing in for that motion. Drop in real video later (`<video>` swap).
- Respects `prefers-reduced-motion`.

## Files
- `index.html` — structure
- `styles.css` — all styling + the device-oval component, reveals, responsive scaling
- `script.js` — scroll choreography (pin progress, cross-fades, hero artboard scaling)
- `assets/` — images & SVGs exported from the Figma file
