---
name: FluentCards Design System
colors:
  surface: '#ffffff'
  surface-dim: '#e2e8f0'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#f1f5f9'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#1e293b'
  inverse-on-surface: '#f8fafc'
  outline: '#94a3b8'
  outline-variant: '#e2e8f0'
  surface-tint: '#0fbd4f'
  primary: '#0fbd4f'
  on-primary: '#ffffff'
  primary-container: '#0fbd4f'
  on-primary-container: '#052e14'
  inverse-primary: '#4ade80'
  secondary: '#64748b'
  on-secondary: '#ffffff'
  secondary-container: '#e2e8f0'
  on-secondary-container: '#1e293b'
  tertiary: '#475569'
  on-tertiary: '#ffffff'
  tertiary-container: '#cbd5e1'
  on-tertiary-container: '#0f172a'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#fecaca'
  on-error-container: '#7f1d1d'
  primary-fixed: '#bbf7d0'
  primary-fixed-dim: '#4ade80'
  on-primary-fixed: '#052e14'
  on-primary-fixed-variant: '#166534'
  secondary-fixed: '#e2e8f0'
  secondary-fixed-dim: '#cbd5e1'
  on-secondary-fixed: '#0f172a'
  on-secondary-fixed-variant: '#334155'
  tertiary-fixed: '#e2e8f0'
  tertiary-fixed-dim: '#cbd5e1'
  on-tertiary-fixed: '#0f172a'
  on-tertiary-fixed-variant: '#334155'
  background: '#ffffff'
  on-background: '#0f172a'
  surface-variant: '#f1f5f9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
  display-md:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.15'
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
  container-max: 1280px
---

## Brand & Style

FluentCards is a language learning platform built around Anki-style flashcards with spaced repetition. The design system is anchored in a **"Clean Green"** aesthetic — approachable, energetic, and focused on learning. The green primary color (#0fbd4f) evokes growth, progress, and positive reinforcement.

The brand personality is **friendly and encouraging** without being childish. Clean whites and slate neutrals create a professional reading environment, while the vibrant green accent provides clear interactive signals and celebrates progress.

## Colors

- **Primary (Green #0fbd4f):** Used for primary actions, active navigation, progress indicators, and success states. Represents growth and achievement.
- **Primary-light (#4ade80):** Used for hover states and subtle highlights.
- **Primary-bg (#bbf7d0):** Background tint for success banners and accomplishment cards.
- **Neutrals (Slate scale):** Clean, professional foundation. White backgrounds with slate-50 for section alternation and slate-900 for text.
- **Error (Red):** Standard red for destructive actions and error states.

## Typography

**Inter** is the sole typeface for both display and body text. Its neutral, highly legible design suits long study sessions and works well at all sizes. Hierarchy is established through weight (Bold 700 for headings, Medium 500 for labels, Regular 400 for body) and size rather than font changes.

- **Display (48px/36px):** Hero and landing page headlines only.
- **Headline (28px/22px):** Section headers and feature titles.
- **Body (18px/16px/14px):** Paragraphs, card content, and descriptions.
- **Label (14px/12px):** Button labels, metadata, captions. Small labels use letter-spacing for clarity.

## Layout & Spacing

The layout uses an 8px linear spacing scale with a 1280px max-width container. An 8px base rhythm governs all margins and paddings. Cards and sections use generous whitespace (24px+) between them to prevent cognitive overload — important for learners who are processing new information.

- **Grid:** 12-column fluid grid for desktop, single-column for mobile.
- **Sidebar:** Fixed left sidebar for the app (fluentcards app), bottom tab bar on mobile.
- **Gutter:** 24px between columns.

## Elevation & Depth

Depth is achieved through tonal background layers rather than heavy shadows.

- **Level 0 (Base):** White (#ffffff) — the canvas.
- **Level 1 (Card):** `slate-50` (#f8fafc) — containers and side sections.
- **Level 2 (Elevated):** White with subtle shadow — dropdowns, modals, floating elements.
- **Borders:** Use `slate-200` (#e2e8f0) 1px borders for card outlines.

## Shapes

The shape language uses **8px (rounded-xl)** as the standard corner radius for cards, and **8px (rounded-lg)** for buttons and inputs. This provides a consistent, modern rounded feel without being overly playful.

- **Cards:** `rounded-xl` (8px)
- **Buttons:** `rounded-lg` (8px)
- **Badges/Chips:** `rounded-full` (pill shape)
- **Avatars:** `rounded-full`

## Components

### Buttons
- **Primary:** Green (#0fbd4f) fill with white text. Hover shifts darker.
- **Secondary/Outline:** White background with green 1px border.
- **Ghost:** No background, green text.
- All buttons use `rounded-lg` and 14px Inter Medium.

### Cards
White background, `rounded-xl`, optional 1px `slate-200` border. Used for flashcard review, deck lists, and content groupings.

### Flashcards (App)
The core component. Front side: Japanese text (large, centered). Back side: definition/reading split layout with "Got it" (green) and "Still learning" (outline) actions. Progress indicator at top.

### Progress Bars
Thin 4px bars. Completed segments in green (#0fbd4f). Current segment with a subtle glow. Empty segments in slate-200.

### Navigation (App)
Sidebar (desktop) or bottom tab bar (mobile). Active state uses green (#0fbd4f) text/icon with a green left pill indicator on desktop.

### Input Fields
White background, 1px `slate-300` border, `rounded-lg`. Focus state: 2px green border ring.

## Animations

- **Reveal-up:** Elements fade and slide up on scroll into viewport.
- **Reveal-scale:** Elements scale in (used for modals and overlays).
- **Float:** Gentle vertical floating animation for decorative elements.
- **Card flip:** Horizontal 3D rotation for flashcard reveal.
