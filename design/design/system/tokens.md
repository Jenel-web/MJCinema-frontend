# MJCinema design tokens

Exact values used across every screen in `design/screens/`. Dark theme only. Desktop 1440, mobile 390.

## Color

| Token | Hex / value | Use |
|---|---|---|
| `--bg` | `#08080A` | Page ground |
| `--s1` | `#121216` | Cards, dialogs, sidebar, bottom bars |
| `--s2` | `#1A1A20` | Inputs, dialog inner panels, toast |
| `--s3` | `#25252D` | Hover, disabled buttons, avatars, rank badges |
| `--ln` | `rgba(255,255,255,0.09)` | Default 1px border |
| `--ln2` | `rgba(255,255,255,0.16)` | Strong border (dialogs, ghost buttons, posters) |
| `--tx` | `#F5F5F6` | Primary text |
| `--mu` | `#A6A6B0` | Secondary text, labels, captions |
| `--rd` | `#D91F27` | Projector red: primary button, active state, logo |
| `--rd2` | `#EF3A41` | Red hover, chart bar top |
| `--gd` | `#E6B25D` | Gold: ratings, VIP, balance, revenue |
| `--bl` | `#6EA8FE` | Balcony tier |
| `--ok` | `#3ECF8E` | Success, paid, active |
| `--wn` | `#F5A524` | Warning, coming soon |
| error text | `#FF8A8F` (text), `#FFB3B6` (banner text) | Errors, cancelled |
| logo fold | `#8F1218` | Darker stroke in the logo M |

Tinted fills (always on a dark surface):

| Name | Value |
|---|---|
| Red tint (selected row, active nav) | `rgba(217,31,39,0.14)` with border `rgba(217,31,39,0.4)` |
| Error banner | bg `rgba(239,58,65,0.12)`, border `rgba(239,58,65,0.4)` |
| Success banner | bg `rgba(62,207,142,0.12)`, border `rgba(62,207,142,0.4)`, text `#9FF0C9` |
| Badge success | bg `rgba(62,207,142,0.14)`, text `#3ECF8E` |
| Badge warning | bg `rgba(245,165,36,0.14)`, text `#F5A524` |
| Badge cancelled | bg `rgba(239,58,65,0.16)`, text `#FF8A8F` |
| Badge neutral | bg `rgba(255,255,255,0.08)`, text `#A6A6B0` |
| Glass card | `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))` + 1px `--ln` |
| Red page glow | `radial-gradient(60% 420px at 50% 0%, rgba(217,31,39,0.28), transparent 70%)` over `--bg` |
| Dialog scrim | `rgba(0,0,0,0.7)` |

Red is only for the primary action, the active state and the logo. Gold marks anything premium.

## Typography

| Role | Font | Weights |
|---|---|---|
| Display / headings | **Barlow Condensed** | 600, 700, 800 (headings use 800) |
| Body / UI | **DM Sans** | 400, 500, 600, 700 |

Headings: uppercase, `letter-spacing: 0.015em`, `line-height: 1`.

| Style | Font | Size | Notes |
|---|---|---|---|
| Hero title | Barlow Condensed 800 | 104 (line-height 0.9) | Dashboard featured movie |
| Display | Barlow Condensed 800 | 88 | Design system sample |
| Auth title | Barlow Condensed 800 | 64 | Login and register hero text |
| Page title | Barlow Condensed 800 | 56 / 48 / 44 / 40 | Cinemas 56, Sign in 48, My bookings 44, admin pages 40 |
| Section heading | Barlow Condensed 800 | 40 | "Now showing", "Coming soon" |
| Card heading | Barlow Condensed 800 | 32 / 28 / 26 / 24 | Dialog titles 32, card titles 26–28 |
| Stat number | Barlow Condensed 800 | 56 / 44 | Admin stat cards |
| Lead | DM Sans 400 | 17–18 / 26–28 | Hero description |
| Body | DM Sans 400 | 15 / 1.5 (base), 16 / 24 | |
| Small | DM Sans 400–500 | 14 / 20 | Metadata, table cells |
| Caption / label | DM Sans 500 | 13 / 18 | Field labels, table headers |
| Micro | DM Sans 600 | 12 | Badges, date tags |
| Button | DM Sans 600 | 14–16 | |
| Ticket code | monospace 600 | 14, letter-spacing 0.06em | |

Line length: body copy max 460–560px.

## Radius

| Value | Use |
|---|---|
| 4 | Seat bottom corners |
| 8 / 9 / 10 | Seats (top 9, bottom 4), table header cells, small icon buttons |
| 12 | Inputs, selects, posters, time-slot chips, banners, list rows |
| 14 | Showtime cards, toast icon cards |
| 16 | Cards, dialogs (20), toast |
| 20–28 | Dialogs 20, mobile featured card 20, auth card 28 |
| 999 | Buttons, chips, badges, tabs, avatars, icon buttons |

## Spacing

Base unit 4. Scale in use: `4 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 32 · 40 · 48 · 56 · 72`.

| Where | Value |
|---|---|
| Page gutter, desktop | 40 |
| Page gutter, mobile | 16 |
| Card padding | 22–24 (dialogs 28) |
| Section padding (design system) | 72 vertical |
| Grid gap, poster grid | 28 row, 20 column (mobile 24 / 14) |
| Grid gap, card grids | 16–20 |
| Admin content padding | 24 32 48 |

## Layout widths

| Screen | Max width |
|---|---|
| Client pages (nav, dashboard, cinema) | 1280 inner, 40 gutter |
| Auth card | 1200 |
| Movie details dialog | 1040 |
| Seat booking | 1100 |
| My bookings | 1000 |
| Admin sidebar | 248 |
| Dialogs | 440–460 (confirm, status), 540 (add movie, add schedule), 240 (profile menu), toast 380 |

## Control sizes

| Control | Height |
|---|---|
| Primary button (seats, mobile) | 52 |
| Button (auth, hero) | 48 |
| Button (default) | 44–46 |
| Button (small, admin) | 36–44 |
| Input | 52 (auth), 48 (dialogs), 44 (search) |
| Chip | 36 (filters), 44 (time slots, mobile) |
| Icon button, avatar button | 44 |
| Badge | 24 |
| Touch target minimum | 44 |

## Posters (placeholder art)

2:3 ratio, 12px radius (10 or 8 in compact lists). Background:
`radial-gradient(110% 70% at 75% 8%, hsl(H 75% 48%), transparent 62%), linear-gradient(180deg, hsl(H 45% 20%), hsl(H 55% 7%))`

Hue `H` per poster: 2 (red), 32 (orange), 212 (blue), 160 (green), 275 (purple), 340 (pink), 48 (gold), 190 (teal). Title overlay: Barlow Condensed 800, uppercase, bottom-left, 12px inset. Replace with TMDB poster images.

## Seats

| Item | Desktop | Mobile |
|---|---|---|
| Seat size | 32 × 30 | 20 × 22 |
| Seat radius | 9 / 9 / 4 / 4 | 6 / 6 / 3 / 3 |
| Gap between seats | 8 | 4 |
| Seats per row | 14, aisles after seat 4 and 10 (4 · 6 · 4) | 12, aisles after seat 3 and 9 (3 · 6 · 3) |
| Rows | A to J | A to J |

| State | Style |
|---|---|
| Available | bg `#1A1A20`, 1.5px border `rgba(255,255,255,0.16)` |
| Selected | bg `#D91F27`, border `#D91F27` |
| Occupied | bg `#2D2D35`, no border, opacity 0.5 |
| VIP (rows A–B) | border `#E6B25D` · ₱450 |
| Regular (rows C–G) | default border · ₱320 |
| Balcony (rows H–J) | border `#6EA8FE` · ₱260 |

Prices are sample values. The screen indicator is a curved top border (4px `#F5F5F6`) with a white-to-transparent fill and a red glow `0 -14px 40px rgba(217,31,39,0.35)`.

## Components

| Component | Spec |
|---|---|
| Primary button | bg `#D91F27`, text `#FFFFFF`, 600, pill. Hover `#EF3A41`. Disabled bg `#25252D`, text `#8A8A94` |
| Ghost button | bg `rgba(255,255,255,0.07)`, border `--ln2` |
| Danger-soft button | bg `rgba(239,58,65,0.1)`, border `rgba(239,58,65,0.6)`, text `#FF9A9E` |
| Chip / tab | pill, bg `rgba(255,255,255,0.04)`, border `--ln`, text `--mu`. Active chip: bg `#D91F27`. Active tab: bg `#F5F5F6`, text `#08080A` |
| Input | bg `#1A1A20`, 1px `--ln`, radius 12, padding 0 16. Focus: border `#D91F27` + `0 0 0 4px rgba(217,31,39,0.22)`. Error: border `#FF8A8F` |
| Client nav | 72 tall, 1px bottom border. Active link: 2px red underline |
| Admin sidebar | 248 wide, bg `rgba(18,18,22,0.7)`. Active item: red tint fill + red border, icon `#EF3A41` |
| Table | header row bg `rgba(255,255,255,0.04)`, row height ~52, 1px row dividers |
| Progress bar | 8 tall, radius 4, track `rgba(255,255,255,0.08)`. Fill red (sales), gold (best showtimes), occupancy fills `#3ECF8E` ≥80%, `#E6B25D` ≥50%, `#EF3A41` below |
| Chart bars | width 34, radius 8, vertical gradient `#EF3A41` to `#7D1217` |
| Dialog | bg `#121216`, 1px `--ln2`, radius 20, padding 28, scrim `rgba(0,0,0,0.7)` |
| Toast | 380 wide, bg `#1A1A20`, 1px `--ln2`, radius 16, bottom right, green check icon, 5 second auto close |

Motion: 150ms ease on hover and press; dialogs fade and rise 8px; poster hover lifts 4px. Nothing animates on its own.

## Logo

Wordmark "JCINEMA" in Barlow Condensed 800, `letter-spacing: 0.02em`, color `#D91F27`, preceded by a custom M mark (SVG, viewBox `0 0 40 48`):

```svg
<svg viewBox="0 0 40 48">
  <path d="M0 0h9l11 22L31 0h9v48h-9V18L21 38h-2L9 18v30H0z" fill="#D91F27"/>
  <path d="M31 0 20 22l1 16 10-20z" fill="#8F1218"/>
</svg>
```

Sizes: nav 30px type with a 18 × 21 mark, compact 20px, hero 132px. App icon: white M (`#FFFFFF`, fold `#F5B7BA`) on `#D91F27`. Align mark to the text baseline.

## Screen to file map

| Spec section | File |
|---|---|
| 4.1 Login | `4.1-login.png`, `4.1-login-error.png` |
| 4.2 Register | `4.2-register.png`, `4.2-register-success.png` |
| 4.3 Dashboard | `4.3-dashboard-now-showing.png`, `4.3-dashboard-coming-soon.png`, `4.3-dashboard-states.png` (loading, empty, error) |
| 4.3 Cinema | `4.3-cinema-list.png`, `4.3-cinema-detail.png`, `4.3-cinema-empty.png` |
| 4.3 Movie details | `4.3-movie-modal.png`, `4.3-showtime-picker.png`, `4.3-profile-dropdown.png` |
| 4.4 Booking | `4.4-seat-booking.png`, `4.4-confirm-modal.png`, `4.4-status-success.png`, `4.4-status-failed.png` |
| 4.5 Tickets | `4.5-tickets-active.png`, `4.5-tickets-cancel-dialog.png`, `4.5-tickets-cancel-result.png` |
| 5.1 Admin home | `5.1-admin-home.png` |
| 5.2 Admin movies | `5.2-admin-movies.png`, `5.2-add-movie-modal.png` |
| 5.3 Admin schedules | `5.3-admin-schedules.png`, `5.3-add-schedule-modal.png` |
| 5.4 Admin bookings and users (proposed) | `5.4-admin-bookings.png`, `5.4-admin-users.png` |
| 5.5 Toast | `5.5-toast.png` |
| Mobile (390 wide, exported at 2x) | `mobile-dashboard.png`, `mobile-seat-booking.png`, `mobile-tickets.png`, `mobile-login.png`, `mobile-movie-details.png` |
