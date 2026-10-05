---
name: Nocturne Cinema
colors:
  surface: '#131317'
  surface-dim: '#131317'
  surface-bright: '#39393d'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#201f23'
  surface-container-high: '#2a292d'
  surface-container-highest: '#353438'
  on-surface: '#e5e1e6'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e5e1e6'
  inverse-on-surface: '#303034'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#c7c5ce'
  on-secondary: '#2f3037'
  secondary-container: '#484950'
  on-secondary-container: '#b8b7c0'
  tertiary: '#ffb869'
  on-tertiary: '#482900'
  tertiary-container: '#ca801e'
  on-tertiary-container: '#3f2300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#e3e1ea'
  secondary-fixed-dim: '#c7c5ce'
  on-secondary-fixed: '#1a1b21'
  on-secondary-fixed-variant: '#46464d'
  tertiary-fixed: '#ffdcbb'
  tertiary-fixed-dim: '#ffb869'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#673d00'
  background: '#131317'
  on-background: '#e5e1e6'
  surface-variant: '#353438'
typography:
  display-xl:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes a focused, immersive theater atmosphere for collaborative media viewing. The interface recedes completely into deep void tones, centering user attention entirely on shared video content and low-friction social interaction. The aesthetic pairs the discipline of modern dark-mode minimalism with refined, luminous cinema cues—soft specular edges, subtle violet ambient halation, and crisp typography. 

The emotional tone is intimate, premium, and distraction-free: it mimics the sensation of sitting in an acoustic screening room where hardware fades into total darkness. Controls, sidebars, and chat streams remain subordinate until summoned or actively read, balancing social engagement with cinematic gravity.

## Colors
The palette is built upon layered deep-space values rather than harsh flat blacks, preserving depth across complex multi-window interfaces:

- **Base Void (`#07070A`)**: Background canvas for full-bleed player areas and base viewport.
- **Top Navigation (`#0B0B10`)**: Header plane providing subtle structural grounding with sticky positioning.
- **Primary Surface (`#101116`)**: Main structural panels, collapsible sidebars, and elevated video containers.
- **Secondary Surface (`#14151B`)**: Active interactive tiles, chat message bubbles, dropdowns, and nested toolbars.
- **Border Trim (`rgba(255, 255, 255, 0.06)`)**: Ultra-subtle hairline borders to define boundaries without visual noise.
- **Accent Violet (`#8B5CF6`)**: Single luminous accent used deliberately for playback head positions, live timestamps, participant active-speaking indicators, and primary CTAs.
- **Text Layers**: High-fidelity `#F5F5F7` for crisp readability, balanced by `#A1A1AA` for secondary meta/timestamps, and `#71717A` for subtle structural labels and keyboard shortcuts.

## Typography
Typography balances cinematic elegance with instant UI legibility. **Sora** brings a clean, geometric silhouette to room titles, media headers, and modal announcements, delivering high-tech precision without feeling industrial. **Plus Jakarta Sans** grounds chat streams, room settings, and contextual menus with open apertures and neutral proportions, ensuring rapid reading speeds during fast-moving conversations. 

Timecodes, latency stats, and room sync metrics invoke **JetBrains Mono** to ensure zero layout shift during continuous numerical updates.

## Layout & Spacing
The layout leverages an asymmetric fluid grid centered around the primary viewing viewport. On desktop, the primary 16:9 stage occupies an auto-expanding main column, while the interactive party panel (chat, participants, playlist queue) reserves a fixed 380px or 420px right dock.

- **Breakpoints**: 
  - Mobile (<768px): Single-column stack. Player sits top-pinned (16:9 fixed ratio); tabs toggle below between live chat, playlist queue, and audio controls.
  - Tablet (768px - 1024px): Player scales with overlay side drawers.
  - Desktop (>1024px): 12-column persistent flex architecture. Video player expands to fill up to 8–9 columns, party sidebar locks to remaining columns.
- **Rhythm**: Layout rhythm adheres to a strict 4px/8px modular cadence. Inner container gaps utilize `space-sm` (8px) for compact chat logs and `space-md` (16px) for module separation. Outer canvas margins utilize `space-xl` (40px) on large screens to preserve a generous theatrical frame.

## Elevation & Depth
Depth avoids heavy, opaque dropshadows in favor of structural tonal tiers and soft ambient luminescence:

- **Surface Tiers**:
  - `Level 0 (Canvas)`: `#07070A` flat void.
  - `Level 1 (Panels & Top Bar)`: `#0B0B10` and `#101116` with a border contour of `1px solid rgba(255, 255, 255, 0.06)`.
  - `Level 2 (Popovers, Overlays, Floating Controls)`: `#14151B` backed by a 16px blur (`backdrop-filter: blur(16px)` with `rgba(20, 21, 27, 0.85)`).
- **Ambient Violet Halation**: Floating player controls and active party state elements project an atmospheric glow using `box-shadow: 0 0 24px -4px rgba(139, 92, 246, 0.15)`. Critical active states (e.g., sync trigger or host microphone active) intensify this glow to `rgba(139, 92, 246, 0.3)`.

## Shapes
A roundedness factor of 2 provides tailored 8px corner radii (`rounded-md`) for buttons, text fields, and chat item segments, expanding to 16px (`rounded-lg`) for primary content wrappers, theater canvases, and dialog modals. Full rounded pills (`9999px`) are reserved exclusively for live presence tags, scrub bar playheads, and quick reaction toggles to signal tactile, instant triggers.

## Components

### Buttons
- **Primary**: Solid `#8B5CF6` background, `#FFFFFF` text, subtle upward inner shadow (`inset 0 1px 0 rgba(255,255,255,0.2)`). Hover transitions to `#7C3AED` with an 8px violet ambient glow.
- **Secondary**: `#14151B` background, `rgba(255,255,255,0.06)` border, `#F5F5F7` text. Hover scales border to `rgba(255,255,255,0.14)`.
- **Ghost / Transport**: Transparent base with `#A1A1AA` icons; hover illuminates to `#F5F5F7` text and `#101116` background pill.

### Cards & Queues
- Compact cards for upcoming YouTube videos utilize `#101116` backgrounds, `1px solid rgba(255,255,255,0.06)` outlines, and 12px padding. 
- The currently playing card features a persistent left accent border (`2px solid #8B5CF6`) and an animated audio-wave indicator.

### Input Fields (URL & Chat)
- Flat `#0B0B10` fill with inset hairline border `rgba(255,255,255,0.06)`. 
- Focus state elevates border to `#8B5CF6` accompanied by an external `0 0 0 3px rgba(139, 92, 246, 0.15)` ring. Placeholders rest at `#71717A`.

### Chips & Room Badges
- Synced status pills feature a `#14151B` background with a glowing 6px green or violet dot indicating playback sync accuracy.
- Reaction chips deploy pill radii with subtle spring hover physics.

### Synchronized Player Controls
- The progress scrubber utilizes a 4px rail (`rgba(255,255,255,0.12)`) filling with `#8B5CF6`. 
- Co-viewer avatars cluster above the scrub bar at their corresponding current playback timestamps.

### Chat & Participant List
- Message rows use clean zero-gutter layouts with colored participant initials, `#F5F5F7` message bodies, and `#71717A` inline timestamps.
- System notifications (joins, sync corrections, queue additions) render with monospaced accents in `#A1A1AA`.