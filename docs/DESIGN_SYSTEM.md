# IndustryMentor Design System Specification (v1.0.0)

**Document Status:** Approved & Authoritative  
**Domain:** [https://industrymentor.net](https://industrymentor.net)  
**Target Platform:** Production Web Application (React 18 + TypeScript + Tailwind CSS + shadcn/ui)  
**Core Mission:** *"Bridge the gap between theoretical academic education and practical real-world industry knowledge."*

---

## Table of Contents
1. [A. Brand Personality](#a-brand-personality)
2. [B. Design Principles](#b-design-principles)
3. [C. Color System](#c-color-system)
4. [D. Typography System](#d-typography-system)
5. [E. Spacing System](#e-spacing-system)
6. [F. Border Radius System](#f-border-radius-system)
7. [G. Shadow & Elevation System](#g-shadow--elevation-system)
8. [H. Button System](#h-button-system)
9. [I. Input & Form System](#i-input--form-system)
10. [J. Card System](#j-card-system)
11. [K. Badge & Status Tag System](#k-badge--status-tag-system)
12. [L. Navigation System](#l-navigation-system)
13. [M. Modal & Dialog System](#m-modal--dialog-system)
14. [N. Table & Data Grid System](#n-table--data-grid-system)
15. [O. Dashboard UI System](#o-dashboard-ui-system)
16. [P. Empty States](#p-empty-states)
17. [Q. Loading & Skeleton States](#q-loading--skeleton-states)
18. [R. Error States & Feedback](#r-error-states--feedback)
19. [S. Success States & Verifications](#s-success-states--verifications)
20. [T. Responsive Behavior & Breakpoints](#t-responsive-behavior--breakpoints)
21. [U. Accessibility Guidelines (WCAG 2.1 AA)](#u-accessibility-guidelines-wcag-21-aa)
22. [V. Animation & Motion Guidelines](#v-animation--motion-guidelines)

---

## A. Brand Personality

IndustryMentor sits at the intersection of **Industrial Precision**, **Academic Credibility**, and **Career Advancement**. It is neither a whimsical toy app nor a generic corporate brochure. Its visual language commands respect from factory managing directors, international buying houses, and university graduates alike.

### Core Character Traits
- **Authoritative & Credible:** High contrast, structured grids, precise typography, and zero gimmicks.
- **Industrially Grounded:** Reflects the reality of modern manufacturing floors, technical engineering, production planning, and quality compliance.
- **Outcome-Oriented:** Every screen prioritizes clarity, actionability, tangible skill gains, and career momentum.
- **Disciplined & Clean:** Free of childish illustrations, excessive neon glows, chaotic floating particles, and bloated pill shapes.

### Visual Spectrum
```
[ Playful / Consumer EdTech ]  <--- (IndustryMentor is HERE) --->  [ Boring Legacy Enterprise ERP ]
                                    Industrial Modernity:
                              Precision • Depth • High Contrast
```

---

## B. Design Principles

1. **Content First, Structure Second, Decoration Last:**  
   Every visual element must serve information comprehension. Decorative elements (gradients, spotlights, icons) must never overpower the core content.
2. **Industrial Grid Precision:**  
   Align elements to consistent 4px/8px baselines. High information density in dashboards and technical tables; comfortable vertical rhythm in marketing and course exploration.
3. **Restrained Color Accents:**  
   Surfaces are deep slates and disciplined neutrals. Primary brand blue (`#0284C7` / `#0EA5E9`) is reserved for focal interactions, primary actions, and key indicators. Semantic colors (Emerald, Amber, Rose) are used strictly for status.
4. **Predictable Component States:**  
   Every interactive element must explicitly define default, hover, active, focused, disabled, and loading states.
5. **No Faux-SaaS Clichés:**  
   Avoid rainbow gradients, oversized floating cards with 32px radii, bouncy physics, and crypto-style glowing badges.

---

## C. Color System

The color system uses HSL CSS variables exposed to Tailwind CSS, ensuring crisp rendering across dark surfaces with full WCAG 2.1 AA contrast compliance.

### 1. Palette Architecture (Dark Baseline & Light Compatibility)

| Token Name | CSS Variable | HSL Value | Hex Approx | Semantic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `--background` | `222 47% 6%` | `#080D1A` | Deepest root canvas |
| **Surface / Card** | `--card` / `--surface` | `222 40% 10%` | `#0F172A` | Elevated cards, panels, modules |
| **Surface-2** | `--surface-2` | `222 32% 14%` | `#182238` | Nested modules, input backgrounds |
| **Surface Muted** | `--muted` | `222 28% 18%` | `#212C44` | Inactive tabs, disabled chips |
| **Border Subdued** | `--border` | `222 24% 20%` | `#273552` | Hairline dividers, card outlines |
| **Border Active** | `--border-active` | `222 24% 30%` | `#3A4E78` | Hovered borders, active inputs |
| **Foreground Main** | `--foreground` | `210 40% 98%` | `#F8FAFC` | Primary headings and body text |
| **Foreground Muted** | `--muted-foreground` | `215 20% 70%` | `#94A3B8` | Subtitles, metadata, timestamps |
| **Primary Brand** | `--primary` | `201 96% 42%` | `#0284C7` | Key CTAs, active highlights, logos |
| **Primary Hover** | `--primary-hover` | `201 94% 48%` | `#0EA5E9` | Interactive hover for primary |
| **Primary Text** | `--primary-foreground` | `210 40% 98%` | `#FFFFFF` | Text on top of primary buttons |
| **Secondary** | `--secondary` | `222 28% 18%` | `#212C44` | Secondary buttons, neutral badges |
| **Secondary Text** | `--secondary-foreground` | `210 40% 98%` | `#F8FAFC` | Text on secondary elements |
| **Success / Verified** | `--success` | `158 64% 48%` | `#10B981` | Certificates, completed modules, paid |
| **Warning / Pending** | `--warning` | `38 92% 50%` | `#F59E0B` | Pending approvals, transaction review |
| **Destructive / Error** | `--destructive` | `0 84% 60%` | `#EF4444` | Errors, deletions, rejected status |
| **Info / Notice** | `--info` | `217 91% 60%` | `#3B82F6` | Informational callouts, notes |

### 2. Contrast & WCAG Standards
- `foreground` (`#F8FAFC`) on `background` (`#080D1A`): **18.2:1** (Exceeds AAA).
- `muted-foreground` (`#94A3B8`) on `card` (`#0F172A`): **6.4:1** (Exceeds AA 4.5:1).
- `primary` (`#0284C7`) with white text (`#FFFFFF`): **4.6:1** (Exceeds AA for standard text).
- Interactive focus rings use `ring-primary` with `ring-offset-background` at 2px width.

---

## D. Typography System

The typography system relies on a battle-tested system sans stack (`Inter`, `system-ui`, `-apple-system`, `sans-serif`) paired with native monospace for industrial metrics.

### 1. Type Scale

| Level | Tailwind Classes | Size (Desktop) | Line Height | Tracking | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-4xl sm:text-5xl lg:text-6xl` | 36px – 60px | 1.1 | `-0.025em` | 800 (Extrabold) | Hero banners |
| **H1** | `text-3xl sm:text-4xl` | 30px – 36px | 1.2 | `-0.02em` | 700 (Bold) | Page titles |
| **H2** | `text-2xl sm:text-3xl` | 24px – 30px | 1.25 | `-0.015em` | 700 (Bold) | Section headings |
| **H3** | `text-xl sm:text-2xl` | 20px – 24px | 1.3 | `-0.01em` | 600 (Semibold) | Card titles, modal headers |
| **H4** | `text-lg` | 18px | 1.4 | `normal` | 600 (Semibold) | Module headers, sub-sections |
| **Body Large** | `text-base sm:text-lg` | 16px – 18px | 1.6 | `normal` | 400 / 500 | Hero intro paragraphs |
| **Body Default** | `text-sm sm:text-base` | 14px – 16px | 1.55 | `normal` | 400 (Regular) | Primary content, descriptions |
| **Body Small** | `text-xs sm:text-sm` | 12px – 14px | 1.5 | `normal` | 400 / 500 | Metadata, timestamps, helper text |
| **Caption / Metric** | `text-xs font-mono` | 11px – 12px | 1.4 | `0.02em` | 500 / 600 | Transaction IDs, SMV numbers |

### 2. Bilingual & Bengali Script Support
- Bangla content rendered alongside English must maintain matching optical weights.
- When rendering Bengali (e.g. course outlines, payment instructions in bKash/Nagad), preserve line-height at minimum `1.6` to avoid vowel diacritic clipping.

---

## E. Spacing System

Strict adherence to a 4px/8px incremental scale ensures visual consistency across components.

| Token | Pixels | Application |
| :--- | :--- | :--- |
| `0.5` | 2px | Hairline spacing, borders, icon nudges |
| `1` | 4px | Tight badge padding, micro-gaps |
| `2` | 8px | Button inline gaps, form label margins |
| `3` | 12px | Compact card padding, dropdown item padding |
| `4` | 16px | Default button padding (`px-4 py-2`), input padding |
| `6` | 24px | Standard card content padding (`p-6`), dialog padding |
| `8` | 32px | Section sub-group spacing, grid gutters |
| `12` | 48px | Marketing sub-section spacing |
| `16` | 64px | Page section vertical padding (`py-16`) |
| `24` | 96px | Large hero vertical padding (`py-24`) |

---

## F. Border Radius System

IndustryMentor rejects bloated, cartoonish rounding (`rounded-3xl` / 32px). A restrained hierarchy provides clean, professional geometry:

| Token | Class | Value | Usage |
| :--- | :--- | :--- | :--- |
| **None** | `rounded-none` | 0px | Technical tables, split controls |
| **Small** | `rounded-sm` | 4px (`calc(var(--radius) - 4px)`) | Badges, tags, checkboxes, tooltips |
| **Medium** | `rounded-md` | 6px (`calc(var(--radius) - 2px)`) | Inputs, select triggers, table rows |
| **Base / Large**| `rounded-lg` | 8px (`var(--radius)`) | Buttons, standard cards, dialogs |
| **Extra Large** | `rounded-xl` | 12px | Featured hero panels, modal containers |
| **Full** | `rounded-full` | 9999px | Avatars, icon-only circle buttons |

*Base design token:* `--radius: 0.5rem` (8px).

---

## G. Shadow & Elevation System

Shadows in dark interfaces must be subtle; depth is primarily communicated via surface luminance contrast and hairline borders (`border-border/60`).

| Elevation Level | Class | Definition | Usage |
| :--- | :--- | :--- | :--- |
| **Flat (Level 0)** | `shadow-none border` | `0 0 0 1px hsl(var(--border))` | Inset panels, table containers |
| **Subtle (Level 1)**| `shadow-sm border` | `0 1px 2px 0 rgba(0,0,0,0.3)` | Standard cards, input fields |
| **Medium (Level 2)**| `shadow-md border` | `0 4px 12px -2px rgba(0,0,0,0.4)` | Hovered cards, dropdown menus |
| **Elevated (Level 3)**| `shadow-lg border` | `0 12px 28px -6px rgba(0,0,0,0.5)` | Modals, dialogs, floating drawers |
| **Primary Focus** | `shadow-primary` | `0 0 0 2px hsl(var(--ring))` | Keyboard focused state |

---

## H. Button System

Buttons are primary conversion drivers and must communicate state clearly.

### 1. Variants
1. **`default` (Primary Action):**  
   `bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:translate-y-px`
2. **`secondary`:**  
   `bg-secondary text-secondary-foreground hover:bg-secondary/80 active:translate-y-px`
3. **`outline`:**  
   `border border-border bg-transparent text-foreground hover:bg-surface-2 hover:border-border-active`
4. **`ghost`:**  
   `bg-transparent text-foreground hover:bg-surface-2 active:bg-surface`
5. **`destructive`:**  
   `bg-destructive text-destructive-foreground hover:bg-destructive/90`
6. **`hero` (Brand Accent):**  
   `bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-sm hover:from-sky-500 hover:to-cyan-500`
7. **`cta` (High-Conversion Focal):**  
   `bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-sm hover:shadow-md`
8. **`soft`:**  
   `border border-border/70 bg-card/40 text-foreground hover:bg-card/70`

### 2. Sizes
- **`sm`:** `h-8 px-3 text-xs rounded-md` (Compact tables, utility actions)
- **`default`:** `h-10 px-4 py-2 text-sm rounded-lg` (Standard forms, cards)
- **`lg`:** `h-11 px-6 text-base rounded-lg` (Hero CTAs, checkout triggers)
- **`icon`:** `h-9 w-9 p-0 rounded-md` (Navigation toggles, icon actions)

### 3. Interactive States
- **Hover:** Slight brightness boost or surface elevation transition (150ms).
- **Active:** Micro-scale translation (`active:translate-y-px`).
- **Focus-Visible:** `outline-none ring-2 ring-ring ring-offset-2 ring-offset-background`.
- **Disabled:** `opacity-50 pointer-events-none cursor-not-allowed`.
- **Loading:** Spinner icon replacement with disabled interaction.

---

## I. Input & Form System

Form controls must guarantee error-free input for transactions, passwords, and profile details.

### 1. Anatomy
- **Label:** `text-sm font-medium text-foreground mb-1.5 flex items-center justify-between`
- **Required Indicator:** `text-destructive ml-1` (`*`)
- **Field Container:** `h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors`
- **Focus State:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent`
- **Error State:** `border-destructive focus-visible:ring-destructive text-destructive-foreground`
- **Helper Text:** `text-xs text-muted-foreground mt-1.5`
- **Error Message:** `text-xs font-medium text-destructive mt-1.5 flex items-center gap-1`

### 2. Field Types
- **Text / Number / Email / Password:** Clean standard input with monospace support for codes (`font-mono`).
- **Textarea:** Min-height `80px`, vertical resize only (`resize-y`).
- **Select / Dropdown:** Radix UI select trigger matching input height with chevron indicator.
- **Checkbox / Switch:** High contrast checked state (`bg-primary text-primary-foreground`).

---

## J. Card System

Cards provide modular information grouping across marketing, catalog, and dashboard views.

### Standardized Card Archetypes
1. **Default Card:**  
   `rounded-lg border border-border/70 bg-card text-card-foreground shadow-sm p-6`
2. **Interactive Card (Courses, Mentors, Resources):**  
   Includes smooth border and elevation transition:  
   `transition-all duration-200 hover:border-border-active hover:shadow-md hover:-translate-y-0.5`
3. **Featured Card (Flagship Courses, Capstone Projects):**  
   Subtle brand ring (`ring-1 ring-primary/40`) and priority badge.
4. **Dashboard Metric Card:**  
   High data density with metric figure (`text-2xl font-bold font-mono`), trend indicator, and subdued label.

---

## K. Badge & Status Tag System

Badges designate verified credentials, course formats, and enrollment status.

### Variants
- **`default`:** `bg-primary/15 text-primary border border-primary/25`
- **`secondary`:** `bg-secondary text-secondary-foreground border border-border/40`
- **`success` (Verified / Approved / Completed):**  
  `bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium`
- **`warning` (Pending Review / Action Required):**  
  `bg-amber-500/15 text-amber-400 border border-amber-500/25 font-medium`
- **`destructive` (Rejected / Expired / Error):**  
  `bg-rose-500/15 text-rose-400 border border-rose-500/25 font-medium`
- **`outline`:** `border border-border text-muted-foreground`

---

## L. Navigation System

### 1. Desktop Navigation
- Sticky header (`sticky top-0 z-50 h-16`) with dark backdrop blur (`bg-background/80 backdrop-blur-md border-b border-border/60`).
- Left: Brand logo + title ("Industry**Mentor**").
- Center: Clear text navigation links with active state indicator (`text-foreground font-semibold`).
- Right: Contact hotline + Auth CTA buttons (`Sign In`, `Get Started`, or `Dashboard`).

### 2. Mobile Navigation
- Hamburger trigger with accessible Radix Sheet (`SheetContent side="right"`).
- Full navigation links vertically stacked with minimum 48px touch targets.
- Direct quick-action CTAs at bottom of sheet.

---

## M. Modal & Dialog System

- Built on `@radix-ui/react-dialog` primitives.
- Backdrop overlay: `fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out`.
- Modal surface: `bg-card border border-border/80 shadow-lg rounded-xl max-w-lg p-6`.
- Explicit dismiss button (`X` icon in top-right) and keyboard `Escape` key capture.
- Focus trap locked inside dialog until dismissed.

---

## N. Table & Data Grid System

Essential for student enrollments, transaction verifications, batch management, and course modules.

- Container: `relative w-full overflow-auto rounded-lg border border-border/60 bg-card/50`
- Header: `bg-muted/40 text-muted-foreground font-semibold text-xs uppercase tracking-wider h-11 border-b border-border`
- Row: `border-b border-border/40 hover:bg-surface-2/60 transition-colors h-12`
- Cell: `px-4 py-3 text-sm text-foreground align-middle`
- Numbers / IDs / Amounts: Formatted with tabular numbers (`tabular-nums font-mono`).

---

## O. Dashboard UI System

Optimized for high-information density, quick navigation, and operational oversight.

- **Grid Layout:** Standard 12-column responsive layout (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6`).
- **Metric Cards:** Top metric cards featuring single focal number, sparkline/icon, and delta tag.
- **Section Headers:** Clean divider rows with title, subtitle, and primary contextual action button.

---

## P. Empty States

Whenever a list, table, or tab has no records (e.g., zero enrolled courses, no pending transactions):
- Render a centered container (`py-12 px-4 text-center`).
- Subdued icon enclosed in a soft border circle (`h-12 w-12 text-muted-foreground/60`).
- Clear, empathetic title (`text-base font-semibold text-foreground`).
- Explanatory subtitle (`text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4`).
- Direct action button (`Explore Courses`, `Submit Inquiry`).

---

## Q. Loading & Skeleton States

- Avoid blank flickering screens or layout shifts (CLS).
- Use animated pulse skeletons (`animate-pulse bg-muted/60 rounded-md`).
- Match skeleton dimensions to the exact geometry of target cards, avatars, and table rows.
- High-priority images (e.g. logos) must include pre-allocated aspect ratio boxes.

---

## R. Error States & Feedback

- Form errors appear immediately below the invalid input with an alert icon (`text-xs text-destructive`).
- Network or operation failures trigger a non-blocking toast (`sonner`) with a clear remedy.
- Critical system faults trigger an `ErrorBoundary` fallback showing an apology and reload button.

---

## S. Success States & Verifications

- Certificate verification displays a prominent emerald check badge, student name, issue date, and validation hash.
- Enrollment completion presents an order receipt summary with Transaction ID confirmation and pending review guidance.

---

## T. Responsive Behavior & Breakpoints

Standard Tailwind breakpoints with touch-first accessibility:

| Breakpoint | Minimum Width | Target Devices | Layout Adjustments |
| :--- | :--- | :--- | :--- |
| **`xs`** | 480px | Large mobile phones | 2-column micro-grids, compact buttons |
| **`sm`** | 640px | Tablets (Portrait) | Horizontal form pairs, 2-column cards |
| **`md`** | 768px | Tablets (Landscape) | Topbar navigation visible, mobile drawer hidden |
| **`lg`** | 1024px | Laptops / Small Desktops | 3-column course grid, full sidebar |
| **`xl`** | 1280px | Standard Desktops | 4-column metrics, max container 1280px |
| **`2xl`**| 1400px | Wide Displays | Centered container (`max-w-7xl` / 1400px) |

- Touch targets on mobile must be at least `44px x 44px`.

---

## U. Accessibility Guidelines (WCAG 2.1 AA)

1. **Color Contrast:** All body text maintains minimum 4.5:1 ratio against surface; large text maintains 3:1.
2. **Focus Rings:** All interactive elements (`<button>`, `<a>`, `<input>`, `<select>`) exhibit a distinct 2px visible focus ring upon keyboard tab.
3. **Screen Readers:** All icon-only buttons (`variant="icon"`) must include `<span className="sr-only">Label</span>` or `aria-label`.
4. **Form Labels:** Every form control is explicitly associated with an HTML `<label htmlFor="...">`.
5. **Reduced Motion:** All CSS animations and transitions must observe `@media (prefers-reduced-motion: reduce)`.

---

## V. Animation & Motion Guidelines

Motion must feel snappy, mechanical, and industrial — never floating or bouncy.

- **Duration:** 150ms for micro-interactions (buttons, hovers); 200ms – 250ms for layout transitions (modals, dropdowns).
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out) for entrance; `cubic-bezier(0.7, 0, 0.84, 0)` (ease-in) for exit.
- **Allowed Transitions:**
  - Card hover border & subtle shadow lift.
  - Dropdown and modal fade-in-scale.
  - Accordion height expand/collapse.
  - Skeleton loading pulse.
- **Strictly Prohibited:** Infinite floating elements, slow wobble animations, 3D card tilt effects, aggressive full-page parallax scrolls.
