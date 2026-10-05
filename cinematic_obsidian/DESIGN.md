---
name: Cinematic Obsidian
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#ebbbb4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#b18780'
  outline-variant: '#603e39'
  surface-tint: '#ffb4a8'
  primary: '#ffb4a8'
  on-primary: '#690100'
  primary-container: '#ff5540'
  on-primary-container: '#5c0000'
  inverse-primary: '#c00100'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#acc7ff'
  on-tertiary: '#002f67'
  tertiary-container: '#488fff'
  on-tertiary-container: '#00285b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930100'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#acc7ff'
  on-tertiary-fixed: '#001a40'
  on-tertiary-fixed-variant: '#004491'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for synchronized streaming experiences where media takes center stage. The emotional profile is focused, cinematic, immersive, and social without distraction. It rejects aggressive gamer aesthetics and glowing neons in favor of theatrical restraint: content glow illuminates the interface rather than artificial UI decoration.

Targeted at groups watching video content collaboratively, the interface operates as a digital theater. The design language marries precision media controls with quiet, atmospheric surfaces. Micro-interactions are deliberate and swift, prioritizing uninterrupted viewing, high legibility in low-light environments, and rapid glanceability during active group sessions.

## Colors

The palette is engineered around pure value-based dark tiers to establish visual hierarchy without clutter.

- **Canvas Background (`#0A0A0A`):** The ground level for the media viewport and full-bleed chrome.
- **Surfaces:**
  - Primary Surface (`#121212`): Sidebars, main application backdrops, and navigation bars.
  - Secondary Surface (`#181818`): Cards, chat modules, and segmented panels.
  - Elevated Surface (`#202020`): Modals, dropdown menus, context menus, and tooltips.
- **Accents:**
  - Primary Brand Red (`#FF0000`): Playheads, primary action buttons, active states, live indicators.
  - Brand Hover Red (`#CC0000`): Hover and pressed states for primary actions.
  - Soft Red Surface (`rgba(255, 0, 0, 0.12)`): Active room badges, highlighted sync states, and subtle tag fills.
  - Success / Sync State (`#22C55E`): Co-viewer online statuses, buffer synchronization confirmations.
  - Destructive (`#DC2626`): Room termination, kicking users, disconnecting.
- **Typography & Outlines:**
  - Primary Typography (`#FFFFFF`): High-contrast titles, chat messages, active states.
  - Secondary Typography (`#AAAAAA`): Metadata, timestamps, user handles, auxiliary controls.
  - Muted Typography (`#717171`): Placeholder text, disabled actions, passive counters.
  - Structural Borders (`rgba(255, 255, 255, 0.08)`): Crisp boundary lines separating controls and viewports without heavy contrast.

## Typography

The design system relies on **Inter** across all functional hierarchy layers, complemented by **JetBrains Mono** for technical timestamps, room tokens, and playback latency meters. 

- **Display & Headlines:** Tightly tracked with negative letter-spacing to present a modern, cinematic demeanor without appearing expressive or decorative.
- **Body & Chat:** Balanced line heights maintain continuous readability during high-velocity chat streams alongside 16:9 video playback.
- **Labels & Micro-copy:** Positive letter-spacing applied to small-scale uppercase controls (e.g., "LIVE", badges, timestamps) ensures legibility even on low-luminance displays.

## Layout & Spacing

The layout is constructed using an asymmetric fluid grid optimized for high-ratio video playback alongside persistent metadata and real-time social columns.

- **Desktop (1024px+):** Primary media container maintains a dynamic 16:9 ratio constrained to maximum viewport height. A fixed-width secondary column (360px–420px) hosts the room chat, synced queue, and participant list. Outer margins adapt from `margin-md` (24px) to `margin-lg` (32px).
- **Tablet (768px – 1023px):** Fluid grid shifts to a stacked view or tabbed collapsible side drawer. Gutters collapse to `gutter` (16px).
- **Mobile (< 768px):** Full-bleed edge-to-edge video pinned to the top screen boundary with bottom tabbed controls for conversation, room roster, and recommended queues. Lateral canvas margins set to `margin` (16px).
- **Component Rhythms:** Internal padding follows strict multiples of `space-xs` (4px). Structural groupings use `space-md` (16px), while tight metadata pairings use `space-xs` (4px) and `space-sm` (8px).

## Elevation & Depth

Depth is articulated through **tonal layering** and **low-contrast outlines** rather than diffuse light casting. Heavy box shadows are forbidden, ensuring the interface remains strictly dark-room native.

- **Level 0 (Canvas `#0A0A0A`):** The deepest layer, reserved for the video viewport and letterboxing margins.
- **Level 1 (Base `#121212`):** Primary window frames, navigation docks, and queue panels.
- **Level 2 (In-Page Surface `#181818`):** Chat item cards, video queue cards, control bars, and user profile panels. Defined by a crisp border: `1px solid rgba(255, 255, 255, 0.08)`.
- **Level 3 (Overlay Surface `#202020`):** Flyout drawers, volume sliders, settings modals, and contextual menus. Framed with `1px solid rgba(255, 255, 255, 0.12)` and backed by an ambient floor shadow: `0 8px 24px rgba(0, 0, 0, 0.75)`.
- **Backdrop Dimming:** Modals and bottom sheets dim the media canvas with `rgba(0, 0, 0, 0.8)` without blur, maintaining crisp hardware rendering.

## Shapes

The design system maintains a **soft architectural structure (`roundedness: 1`)**. 

- **Micro elements & inputs:** 4px (`0.25rem`) corner radius applied to form fields, chips, action buttons, and scrubbers.
- **Cards & Viewports:** 8px (`0.5rem`, `rounded-lg`) applied to video preview thumbnails, participant tiles, and panel containers.
- **Floating Overlays & Modals:** 12px (`0.75rem`, `rounded-xl`) applied to floating theater controls, full-screen notifications, and modal viewports.
- **Full Radius (Pill):** Strictly reserved for badge counts, live session indicators, and user avatars to maintain immediate geometric contrast against square video tiles.

## Components

### Buttons
- **Primary:** Background `#FF0000`, text `#FFFFFF`, radius `4px`, font `label-lg`. Hover transitions to `#CC0000`. Active state scales subtly (`0.98`).
- **Secondary:** Background `#181818`, border `1px solid rgba(255, 255, 255, 0.08)`, text `#FFFFFF`. Hover changes background to `#202020`.
- **Ghost / Icon Controls:** Transparent background, icon fill `#AAAAAA`. Hover changes fill to `#FFFFFF` with a subtle circular hover plate of `rgba(255, 255, 255, 0.08)`.

### Chips & Filter Tags
- **Default:** Background `#181818`, border `1px solid rgba(255, 255, 255, 0.08)`, text `#AAAAAA`, radius `4px`.
- **Active / Selected:** Background `#FFFFFF`, text `#0A0A0A`, border `1px solid #FFFFFF`.
- **Badge Variant (Live/Synced):** Background `rgba(255, 0, 0, 0.12)`, text `#FF0000`, border `1px solid rgba(255, 0, 0, 0.24)`, radius `9999px`.

### Lists & Queue Items
- Single items occupy `#181818` when inactive and `#202020` when hovered. 
- The currently playing item displays a left border accent: `3px solid #FF0000`.
- Dividers between items utilize `rgba(255, 255, 255, 0.04)`.

### Input Fields & Search
- Container uses `#121212` background with border `1px solid rgba(255, 255, 255, 0.08)`, text `#FFFFFF`, and placeholder `#717171`.
- Focused state applies `border-color: #AAAAAA` without outer focus rings. Validation errors switch border to `#DC2626`.

### Video Player Scrubber & Sync Bar
- Track background: `rgba(255, 255, 255, 0.2)`.
- Loaded buffer track: `rgba(255, 255, 255, 0.4)`.
- Playhead progress track: `#FF0000`.
- Playhead thumb: Circular 12px `#FF0000` dot that expands to 14px on scrub interaction.
- Co-viewer sync markers: 2px wide vertical indicators plotted along the timeline in `#22C55E` or user avatar micro-pins.

### Chat & Message Streams
- Chat bubble containers are borderless; user messages sit directly on `#121212` with handle in `#AAAAAA` and body in `#FFFFFF`.
- Host or Moderator messages feature a subtle `#202020` rounded container with a 1px border `rgba(255, 255, 255, 0.08)`.
- Timestamps render in `code-sm` font using `#717171`.