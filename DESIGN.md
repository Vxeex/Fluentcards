---
version: alpha
name: FluentCards
description: A clean, modern language-learning flashcard interface anchored on a light cream/white canvas with vibrant green (#0fbd4f) as the primary accent. The design feels approachable and educational — rounded corners, generous whitespace, and subtle gradient accents create a friendly-but-serious tone. Dark mode uses deep navy (#0b0f17) with the same green accent for continuity.

colors:
  primary: "#0fbd4f"
  primary-hover: "#0b963f"
  primary-light: "#bbf7d0"
  primary-bg: "#f0fdf4"
  primary-border: "#86efac"
  canvas: "#ffffff"
  surface-card: "#131a26"
  surface-elevated: "#1a2435"
  surface-dark: "#0b0f17"
  ink: "#0f172a"
  body: "#334155"
  body-strong: "#1e293b"
  muted: "#94a3b8"
  hairline: "#e2e8f0"
  teal-400: "#2dd4bf"
  teal-500: "#14b8a6"
  emerald-700: "#047857"
  emerald-900: "#064e3b"
  emerald-950: "#022c22"
  success: "#16a34a"
  warning: "#d97706"
  error: "#dc2626"

typography:
  font-family: "Inter", ui-sans-serif, system-ui, sans-serif
  display-xl:
    fontSize: 72px
    fontWeight: 900
    lineHeight: 1.06
    letterSpacing: -0.02em
  display-lg:
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: -0.015em
  display-md:
    fontSize: 36px
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: -0.01em
  title-lg:
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
  title-md:
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.5
  body-md:
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.05em
  button:
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    hover: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary-border}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
  feature-card:
    backgroundColor: "rgba(255,255,255,0.8)"
    rounded: "{rounded.xl}"
    padding: 32px
    border: "1px solid {colors.primary-border}"
  stat-card:
    backgroundColor: "rgba(255,255,255,0.8)"
    rounded: "{rounded.xl}"
    padding: 24px
    border: "1px solid {colors.primary-border}"
    textAlign: center
  flashcard:
    backgroundColor: "rgba(255,255,255,0.95)"
    rounded: "{rounded.xl}"
    padding: 24px
    border: "1px solid {colors.hairline}"
    shadow: "0 4px 24px rgba(15,189,79,0.1)"
  nav:
    height: 56px
    backgroundColor: "rgba(255,255,255,0.9)"
    backdropBlur: true
    borderBottom: "1px solid {colors.hairline}"
---

## Overview

FluentCards is a language-learning flashcard app with a clean, educational aesthetic. The design system is built around a single vibrant green accent (`#0fbd4f`) that conveys growth, progress, and learning. The light mode uses a white/cream canvas with green accents; dark mode shifts to deep navy with the same green for brand continuity.

**Key Characteristics:**
- White/light canvas with green (`#0fbd4f`) as the sole accent color
- Rounded corners throughout (`rounded-xl` for cards, `rounded-lg` for buttons)
- Generous whitespace — content breathes
- Subtle gradient backgrounds (green-50 → white → green-50) between sections
- Dark mode: deep navy (`#0b0f17`) with green accent preserved
- Spring-physics animations for cards and reveals
- Inter font at weight 900 for headlines, 400-500 for body

## Colors

### Brand
- **Primary** (`#0fbd4f`): The sole brand accent. Used for CTAs, highlights, gradients, borders, and active states.
- **Primary Hover** (`#0b963f`): Slightly darker for hover/active states.
- **Teal 400** (`#2dd4bf`): Secondary gradient partner for the green accent.

### Surfaces
- **Canvas** (`#ffffff`): Light mode page floor.
- **Surface Dark** (`#0b0f17`): Dark mode page floor.
- **Surface Card** (`#131a26`): Dark mode card background.
- **Surface Elevated** (`#1a2435`): Dark mode nested card background.

### Text
- **Ink** (`#0f172a`): Headlines and primary text.
- **Body** (`#334155`): Running text, descriptions.
- **Body Strong** (`#1e293b`): Emphasized body text.
- **Muted** (`#94a3b8`): Captions, metadata, secondary labels.

### Semantic
- **Success** (`#16a34a`), **Warning** (`#d97706`), **Error** (`#dc2626`)

## Typography

**Inter** is the sole typeface. Two weights define the voice:
- **Black (900)** for display headlines — bold, confident, educational
- **Medium (500) / Regular (400)** for body — clean, readable, approachable

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| display-xl | 72px | 900 | 1.06 | Hero headline |
| display-lg | 48px | 900 | 1.1 | Section headlines |
| display-md | 36px | 900 | 1.15 | Sub-section headlines |
| title-lg | 24px | 700 | 1.3 | Card titles, feature names |
| title-md | 18px | 500 | 1.5 | Subtitles, lead paragraphs |
| body-md | 16px | 400 | 1.6 | Default body text |
| body-sm | 14px | 400 | 1.5 | Secondary text, captions |
| caption | 12px | 600 | 1.4 | Labels, uppercase badges |
| button | 14px | 700 | 1.0 | Button labels |

## Layout

### Spacing
- **Base unit:** 8px
- **Section padding:** 96px vertical between major sections
- **Card internal padding:** 24-32px
- **Gutters:** 20px between grid items
- **Container max-width:** 1280px centered

### Grid
- **Desktop:** 3-column feature grid, 4-column stats grid
- **Tablet:** 2-column
- **Mobile:** 1-column stacked

## Shapes

| Token | Value | Use |
|---|---|---|
| rounded-sm | 8px | Small inputs, tags |
| rounded-md | 12px | Buttons, small cards |
| rounded-lg | 16px | Primary buttons, form elements |
| rounded-xl | 24px | Feature cards, flashcards, large containers |
| rounded-full | 9999px | Avatars, pills, badges |

## Animations

- **springUp**: Bounce-in from below (cubic-bezier 0.34, 1.56, 0.64, 1)
- **floatOrb**: Ambient background gradient orbs drifting
- **card-sway**: Gentle float + rotation for decorative flashcards
- **glow-pulse**: CTA button glow pulse
- **reveal-up / reveal-pop**: Scroll-triggered fade-in animations
