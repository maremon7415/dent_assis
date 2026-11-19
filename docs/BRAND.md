# Lumadent brand

Every product string (name, tagline, contact details) lives in `src/config/site.ts`. A clinic that buys the product white-labels it by editing that file plus the tokens in `src/app/globals.css`.

## Name and tagline

- **Name:** Lumadent. *Luma* (light) + *dent* (tooth): clear, bright, careful dentistry.
- **Tagline:** Dental care that answers back.
- **Positioning:** calm, premium, clinical but warm. It should feel like a well-run clinic, not a startup and not "AI glow".

## Palette

The tokens are CSS variables on `:root` (light) and `.dark`, mapped to Tailwind colours in `@theme inline`. Use the Tailwind names (`bg-primary`, `text-muted-foreground`, `text-success`), never raw hex in components. Every text pair below passes WCAG AA (4.5:1) in its theme.

| Role | Token / class | Light | Dark | Use |
|---|---|---|---|---|
| Enamel surface | `background` | `#F6F4EE` | `#0B1D20` | Page background |
| Ink-teal text | `foreground` | `#0F2B2E` | `#E6EFEC` | Body and headings |
| Card | `card` | `#FCFBF8` | `#10262A` | Raised surfaces |
| Popover | `popover` | `#FDFCFA` | `#132C30` | Menus, dialogs, Clerk |
| Teal primary | `primary` / `primary-foreground` | `#0B6B66` / `#F4FBF9` | `#4CCBB8` / `#062421` | Main action, active nav, links |
| Sage | `secondary` | `#E6ECE7` | `#183539` | Quiet buttons |
| Muted | `muted` / `muted-foreground` | `#ECEAE3` / `#4F6467` | `#142D31` / `#9AB3AF` | Secondary text, fills |
| Mint wash | `accent` / `accent-foreground` | `#D3F1E5` / `#0B3D37` | `#1B4640` / `#C4F4E3` | Selected rows, active tab pill, icon tiles |
| Coral | `destructive` / `destructive-foreground` | `#B5432F` / `#FFF8F6` | `#F2917F` / `#2A0B06` | Cancel, delete, errors |
| Success | `success` | `#1D7348` | `#62CF96` | Confirmed, completed |
| Warning | `warning` | `#8F5506` | `#F1B866` | Pending, attention |
| Info | `info` | `#1F5F86` | `#84C3EA` | Neutral notices |
| Lines | `border` / `input` / `ring` | `#DDDAD0` / `#CFCCC2` / `#0B6B66` | `#24434A` / `#2D4F55` / `#4CCBB8` | Dividers, fields, focus |

Brand-only fills (decoration and illustration, never small text): `mint` `#7FDCBF`, `coral` `#EE8A78`, `ink`, `enamel`. Status badges: tint the background with the status colour and use the status colour as text, e.g. `bg-success/12 text-success`.

Charts use `chart-1` to `chart-5` (teal, mint-green, coral, ink-blue, amber in light; brighter equivalents in dark).

## Type

| Role | Face | Tailwind | Notes |
|---|---|---|---|
| Display | Fraunces (soft axis 60, optical size) | `font-display` | Page titles, section titles, big numbers, the wordmark. Weight 400 to 500; never bold. |
| UI and body | Manrope | `font-sans` (default) | Everything else. 400 body, 500 labels, 600 for emphasis. |
| Code and data | Geist Mono | `font-mono` | Only for codes and IDs, not as decoration. |

Display scale (letter-spacing and line-height built in):

| Class | Size | Use |
|---|---|---|
| `text-display-xl` | 72px | Marketing hero only |
| `text-display-lg` | 52px | Marketing hero on tablets, big section openers |
| `text-display-md` | 38px | Page titles (`PageHeader` at sm+) |
| `text-display-sm` | 28px | Page titles on phones |

Body uses Tailwind's scale: `text-base` (16px) for reading, `text-sm` for UI, `text-xs` only for meta. Keep reading measure under about 70 characters (`max-w-2xl`). Tables, `<time>` and `[data-numeric]` get tabular numerals automatically. Sentence case everywhere; no all-caps labels.

## Shape, depth and motion

- Radius: `--radius` 12px. `rounded-md` for controls, `rounded-xl` for cards, `rounded-2xl` for large panels.
- Shadows are tinted with ink-teal and always have an offset (`shadow-xs` on cards, `shadow-lg` on popovers).
- Utilities: `surface-glow` (soft mint light behind a hero), `surface-grid` (faint grid; use sparingly, only where a measured or schedule-like surface makes sense), `focus-ring` (custom controls), `pb-safe` (bottom bars above the iOS home indicator), `--ease-out-expo`.
- Motion is for answers to an action (open, confirm, change). `prefers-reduced-motion` turns animation and transitions off globally.

## Logo

- **Mark:** an original tooth silhouette with a crescent of light cut from its crown. Geometry lives in `src/components/brand/paths.ts` (48 x 48 grid) and is shared by every rendering.
- **Components:** `<LogoMark />` (glyph in `currentColor`, or `variant="tile"` for the fixed app-icon colours), `<Logo />` (mark + "Lumadent" in Fraunces; sizes `sm`, `md`, `lg`).
- **Files:** `src/app/icon.svg` (favicon), `src/app/apple-icon.tsx` (180px PNG), `src/app/opengraph-image.tsx` (1200 x 630).
- **Usage:** on light surfaces the glyph is teal; on dark it follows the theme's primary. Clear space around the lockup is at least the mark's width / 2. Minimum mark size 16px (favicon), wordmark minimum 16px. Do not recolour the tooth to coral, outline it, add a sparkle, rotate it or set the wordmark in another face.
- The old `public/logo.png` is still imported by older pages and emails; nothing new should use it.

## Voice and tone

- Calm, direct, kind. Write like a good receptionist: plain words, short sentences, the next step always clear.
- Name actions by what happens: "Book a visit", "Reschedule", "Cancel visit". The toast repeats the verb: "Visit booked".
- Errors say what went wrong and how to fix it, without apology or blame: "That time was just taken. Pick another slot."
- Empty states invite the next step: "No visits yet. Book your first visit and it will show up here."
- No invented numbers or claims in the app; marketing example copy is marked as such.
- The AI assistant gives general guidance, never a diagnosis, and says so.
