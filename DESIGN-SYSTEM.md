# Design System Specification: The Neo-Stationery Atelier

## 1. Overview & Creative North Star
This design system is built to transform a functional English learning app into a high-end, tactile experience. Our **Creative North Star is "The Neo-Stationery Atelier."**

We are moving away from the "SaaS dashboard" aesthetic and toward the feel of a premium, bespoke digital diary. The system balances "Kitschy" energy—vibrant neon accents and hand-drawn elements—with "Minimalist" restraint. To break the "template" look, we utilize intentional asymmetry (e.g., varying corner radii or off-center alignments), overlapping surfaces, and a typography scale that treats words as editorial elements rather than just data points.

## 2. Colors
The palette is a sophisticated dance between a muted, paper-like foundation and electric bursts of color.

### Palette Application
- **Primary (`#506300` / `#cffc00`):** Use the neon lime (`primary_container`) as your primary "highlight" color—think of it as a physical highlighter on a page.
- **Secondary (`#aa2c32`):** Use this bold coral for moments of high emotional resonance or critical feedback.
- **Tertiary (`#66518c`):** Use soft lavender for reflective AI moments and deep learning states.
- **Surface Foundations:** `surface` (#f7f6f2) is our "paper." Use `surface_container_lowest` (#ffffff) to make active writing areas pop.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a card (using `surface_container_lowest`) should sit on a section background (`surface_container_low`) to define its edge. If the layout feels "bleeding," increase the tonal contrast between surfaces rather than adding a stroke.

### The Glass & Gradient Rule
To ensure the UI feels premium:
- **Glassmorphism:** For floating modals or navigation bars, use `surface` at 80% opacity with a `20px` backdrop-blur.
- **Signature Textures:** Use subtle linear gradients from `primary` to `primary_container` for hero CTAs. This creates a "glow" that flat colors cannot replicate.

## 3. Typography
Our typography is the bridge between "Friendly" and "Authoritative."

- **The Display & Headline (Lexend):** Use Lexend for all `display` and `headline` levels. Its rounded terminals provide the "kitschy" friendliness, but when used at `display-lg` (3.5rem) with tight letter-spacing (-0.02em), it feels like a high-end magazine masthead.
- **The Body (Plus Jakarta Sans):** Use this for all `title`, `body`, and `label` roles. It is highly legible and provides a clean, professional counter-balance to the expressive headlines.
- **Editorial Intent:** Use `headline-lg` for AI feedback and `body-lg` for user diary entries. Maintain generous line heights (1.6x for body text) to reinforce the "Stationery" feel.

## 4. Elevation & Depth
In this system, depth is organic, not structural. We move away from heavy "Neo-brutalism" toward "Ambient Layering."

- **The Layering Principle:** Stack `surface-container` tiers.
    - Level 0: `surface` (The Desk)
    - Level 1: `surface_container_low` (The Notebook)
    - Level 2: `surface_container_lowest` (The Sticky Note)
- **Ambient Shadows:** When an element must "float" (like a primary action button or a sticker), use a shadow with a 24px blur, 0px spread, and 6% opacity. The shadow color must be tinted with the `on-surface` color (#2e2f2d) to mimic natural light hitting paper.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

## 5. Components

### Buttons
- **Primary:** Use `primary_container` background with `on_primary_container` text.
- **Styling:** `xl` (3rem) corner radius. Use a subtle 2px offset shadow of the same color to create a "sticker" look.
- **States:** On hover, shift the background to `primary_fixed_dim`.

### Input Fields (The "Diary" Input)
- **Styling:** Forgo the traditional box. Use a `surface_container_lowest` background with a large `lg` (2rem) radius.
- **Active State:** Instead of a border, use a 4px "glow" (ambient shadow) using the `primary` color at 20% opacity.

### Chips (Selection & Tags)
- **Styling:** Use `surface_container_high`. When selected, toggle to `tertiary_container`.
- **Shape:** Use `full` (9999px) radius for a "pill" feel that mimics stationery stickers.

### Cards & Lists
- **Rule:** **No Divider Lines.**
- **Separation:** Use `32px` or `48px` of vertical white space from our spacing scale to separate list items.
- **Context:** Use `surface_container_low` as the background for the entire list and `surface_container_lowest` for individual items to create a nested, "stacked paper" effect.

### AI Conversation Bubbles
- **User:** `secondary_container` (Coral) with `on_secondary_container` text. Aligned right.
- **AI:** `tertiary_container` (Lavender) with `on_tertiary_container` text. Aligned left.
- **Asymmetry:** Use a `2rem` radius for three corners and a `0.5rem` radius for the corner pointing to the speaker.

## 6. Do's and Don'ts

### Do
- **Do** use large amounts of white space (`surface`). The user's writing is the hero; the UI is the frame.
- **Do** use hand-drawn "stickers" (icons) as decorative accents near headlines to lean into the kitsch vibe.
- **Do** use `display-lg` typography for milestone celebrations (e.g., "7 Day Streak!").

### Don't
- **Don't** use pure black (#000000). Always use `on_surface` (#2e2f2d) for text to maintain a soft, ink-on-paper look.
- **Don't** use sharp corners. Everything in this system should feel safe, approachable, and "soft."
- **Don't** overcrowd the screen. If you have more than three vibrant colors on screen at once, remove one. The kitsch should be an accent, not a distraction.
