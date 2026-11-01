# MJCinema Frontend Redesign Reference

This file documents everything the current frontend does: screens, interactions, popups, user flows and every backend call (with parameters). It exists so the **visual design can be rebuilt without breaking behaviour**. The backend is finished and connected; only the design changes.

> **Rule of thumb:** Every behaviour, API call, `localStorage` key and flow in this file must still work after the redesign. Layout, colours, typography, components and animations are free to change.

Stack: static HTML, CSS and vanilla JS (ES modules), no build step. Deployed on Vercel (`static/vercel.json` rewrites `/js`, `/css`, `/html` and `/images` to `/static/...`). Backend: Spring Boot at `https://mjcinema-backend.onrender.com` (Render free tier, so the first request after idle can take a long time; screens need loading and error states).

Movie posters come from TMDB: `https://image.tmdb.org/t/p/w500` + `movie.poster`.

---

## 1. File map

| File                                               | Role                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `static/index.html`                                | Login screen                                                                  |
| `static/html/register.html`                        | Register screen                                                               |
| `static/html/dashboard.html`                       | Main user screen: Now Showing, Coming Soon, Cinema, movie modal, profile menu |
| `static/html/bookseat.html`                        | Seat selection and booking                                                    |
| `static/html/tickets.html`                         | My Bookings                                                                   |
| `static/html/admin.html`                           | Admin dashboard (Home, Movies, Schedules, Bookings, Users)                    |
| `static/html/cinema.html`                          | **Unused** (nothing links to it). See section 9.                              |
| `static/js/auth.js`                                | `Auth` class: login and register                                              |
| `static/js/ui.js`                                  | `UI` class: login and register error and popup helpers                        |
| `static/js/mjcinema.js`                            | Dashboard and tickets logic                                                   |
| `static/js/bookseat.js`                            | Seat map and booking                                                          |
| `static/js/admin.js`                               | All admin logic                                                               |
| `static/js/main.js`                                | **Dead code** (uses undefined classes, not loaded by any page)                |
| `static/css/style.css`, `tickets.css`, `admin.css` | Styles                                                                        |

## 2. Shared state: `localStorage` keys

| Key                  | Set by                            | Used by                                                        |
| -------------------- | --------------------------------- | -------------------------------------------------------------- |
| `token`              | Login (`jwtToken`)                | Sent as `Authorization: Bearer <token>` on authenticated calls |
| `userId`             | Login                             | Tickets, user details, booking                                 |
| `username`           | Login                             | Shown next to the avatar in the dashboard profile button       |
| `movieId`            | Clicking a movie card             | Stored, barely used                                            |
| `selectedScheduleId` | "Select Seats" in the movie modal | Seat booking page and booking call                             |

Logout does `window.location.href = "/index.html"` and `localStorage.clear()`. There is **no route guard**: pages load without a token, so the redesign should decide whether to add redirects (see section 10).

## 3. Navigation map (who goes where)

```
Login ──(role USER)──────────► Dashboard
  │    └─(any other role)────► Admin
  └─ "Register" ─► Register ─(success, 2s)─► Login

Dashboard
  ├─ Now Showing / Coming Soon / Cinema tabs (same page, content swaps)
  ├─ Movie card ─► Movie modal ─► "Book Seats" ─► showtime picker ─► "Select Seats" ─► Seat booking
  ├─ Profile icon ─► Profile popup ─ My Bookings ─► Tickets
  │                               ├ Profile (does nothing)
  │                               └ Logout ─► Login
Seat booking ─ Back ─► previous page (history.back)
             ─ Booked OK ─► Dashboard
Tickets ─ Back ─► previous page (history.back)
Admin ─ sidebar swaps sections on the same page (no page loads)
```

---

## 4. User screens

### 4.1 Login (`index.html`)

**Elements:** username input, password input, "Remember me" checkbox, "Forgot Password?" link, Login button, "Register" link, error banner (`#auth-feedback`), status popup (`#status-popup`).

**Interactions**
| Action | Result |
|---|---|
| Click **Login** (form submit is blocked) | Calls login API (below) |
| Login success | Saves `userId`, `username`, `token`. Shows green popup "Login successful!". If `role === "USER"` goes to `/html/dashboard.html`, otherwise `/html/admin.html`. |
| Login fails (wrong credentials) | Red error banner "Invalid Username or Password." and the card **shakes**. Banner auto-hides after 3s. |
| Server unreachable | Error banner "Server is offline. Try again later." |
| Click **Register** | Goes to `/html/register.html` |
| "Remember me", "Forgot Password?" | **Do nothing** (not implemented) |

**Popups / feedback:** error banner (3s auto-hide + card shake), status popup (green or red, 3s auto-hide).

**Backend**

- `POST /user/login`, JSON body `{ username, password }`. No auth header. Response: `{ userId, username, jwtToken, role }`. On error: `{ message }`.

### 4.2 Register (`register.html`)

**Elements:** username, password, confirm password, "Join MJCinema" button, "Login Here" link, error banner, status popup.

**Interactions**
| Action | Result |
|---|---|
| Click **Join MJCinema** | Validates, then calls the register API |
| Passwords differ | Error banner "Passwords do not match." (+ shake) |
| Password under 8 characters | Error banner "Password length should be more than 8 characters." |
| Success | Green popup "Account Created. Redirecting...", then goes to `/index.html` after 2s |
| Server error | Red popup with the server's `message` (or "Server is offline. Try again later.") |

**Backend**

- `POST /user/register`, JSON body `{ username, password, confirm }`. No auth header.

### 4.3 Dashboard (`dashboard.html`)

One page with a **top navbar** (logo + "MJCINEMA", Now Showing, Coming Soon, Cinema, profile icon). Three content views swap on the same page.

**On page load:** fetches all movies and stores them in `window.allMovies` (used to look up a movie when a card is clicked), then loads **Now Showing**.

**Backend (load)**

- `GET /movie/show`: all movies (array with `movieId`, `title`, `poster`, `rating`, `overview`, `status`, `showDate`, ...).
- `GET /schedule/now-showing`: array of movies for the Now Showing grid.

#### A. Now Showing tab (default)

- Grid of **movie cards**: poster, title.
- Click a card: opens the **Movie modal** (type `now`).
- States: load failure shows "Failed to load movies."; unexpected data shows "Unexpected data format from server." (no loading skeleton today).

#### B. Coming Soon tab (click "Coming Soon")

- `GET /schedule/coming-soon`
- Same card grid, but each card also shows a **"Coming Soon" tag** and the **release date** (`showDate`, or "TBA").
- Click a card: opens the Movie modal (type `soon`, so **no Book button**).

#### C. Cinema tab (click "Cinema")

- Hides the movie grid and shows the cinema view.
- `GET /cinema/all`: list of cinemas (`cinemaId`, `cinemaName`, `location`).
- Shows **cinema cards**: icon, cinema name, location. Error: "Error connecting to MJCinema server."
- **Click a cinema card:**
  - Calls `GET /cinema/movies/{cinemaId}`.
  - Hides the cinema list and shows the **cinema detail view**: cinema name header, "← Back to Cinemas" link, grid of that cinema's movies (poster, title, `⭐ rating / 10`, status with underscores replaced by spaces).
  - Empty: "No movies currently playing here."
  - Clicking a movie opens the Movie modal (type `soon`, so **no Book button** from here today. Likely unintended; decide in the redesign).
- **"← Back to Cinemas"** returns to the cinema list.

#### D. Movie modal (overlay)

Opens when a movie card is clicked. Dark overlay covering the page, **page scroll is locked** while open.

**Contents:** close (✕), poster, title, rating `⭐ x / 10`, overview, and (for Now Showing only) a **"Book Seats"** button.

| Action               | Result                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Click ✕              | Closes the modal, restores scrolling (no click-outside or Esc close)                                            |
| Click **Book Seats** | Calls `GET /schedule/movieSchedules/{movieId}`. Hides the button and shows the **showtime picker** in the modal |

**Redesign:** the two rows above describe legacy. The new modal has no Book Seats button, loads the schedules on open and closes on Esc too: see section 10 item 11.

**Showtime picker (inside the modal):** heading "Select a Showtime", a dropdown ("-- Choose a showtime --" plus options formatted `showDate | startTime - cinema.location`), and a **"Select Seats"** button.

- Click **Select Seats** with nothing chosen: browser `alert("Please select a time slot first!")`.
- With a choice: saves `selectedScheduleId` to `localStorage` and goes to `/html/bookseat.html`.
- Schedule item fields used: `scheduleId`, `showDate`, `startTime`, `cinema.location`.

#### E. Profile popup (dropdown)

- Click the profile icon: toggles a small dropdown (click anywhere outside closes it).
- Items:
  - **My Bookings**: goes to `/html/tickets.html`
  - **Profile**: **does nothing** (not implemented)
  - **Logout**: clears `localStorage`, goes to `/index.html`

### 4.4 Seat booking (`bookseat.html`)

**Elements:** header (movie title, "✕ Back" button), legend (Available, Selected, Occupied), screen graphic, seat grid, bottom **checkout bar** (selected seats, total in ₱, "Confirm Booking"), confirm modal, status modal.

**On load** (needs `selectedScheduleId`, otherwise logs an error and goes to `/index.html`):

- `GET /schedule/{scheduleId}`: gives `movie.title` (shown in the header) and `cinema` (`totalRows`, `totalColumns`, `seatLayout`). The title falls back to "Title Unavailable".
- `GET /schedule/schedPrice/{scheduleId}`: array of `{ seatCategory, price }` (VIP, REGULAR, BALCONY).
- `GET /seat/occupied/{scheduleId}` with `Authorization: Bearer <token>`: array of taken seat ids such as `["C4","D5"]`.

**Seat map logic**

- `seatLayout` is a string like `SSS__SSSS__SSS`: `S` = seat, `_` = aisle gap. The grid has one column per character.
- Rows are letters A, B, C... for `totalRows` rows. Seats in a row are numbered 1, 2, 3... (aisles do not consume a number). Seat id = row letter + number (e.g. `C4`).
- Occupied seats are marked and **not clickable**. Others toggle **selected / unselected** on click.

**Price logic (frontend-side)**

- Row A or B = `VIP`, row G or H = `BALCONY`, everything else = `REGULAR`. Total = sum of `priceList[category]`.
- Note: this ignores backend seat categories. Keep or fix on purpose; do not change it silently.

**Checkout bar:** shows "Selected Seats: A1, A4" (or "None") and "Total: ₱1,440", updated on every click.

**Flow: confirming a booking**

1. Click **Confirm Booking** with no seats: browser `alert("Please select atleast one seat.")`.
2. With seats: **Confirm modal** opens: "Do you want to proceed with booking these seats?" Buttons: **Go Back** (closes) and **Yes, Book Now**.
3. **Yes, Book Now:** closes the confirm modal and calls the booking API.
4. **Status modal** opens (success or error card with icon, title, message, **Okay** button):
   - Success: 🎟️ "Booking Confirmed!" / "Your seats are secured. Enjoy the show!". **Okay** goes to `dashboard.html`.
   - Failure: ❌ "Booking Failed" / the server's `message` or "An unexpected error occurred." **Okay** just closes the modal.
   - Network error (legacy: logged to console only, no modal): decided in section 10 item 10, it now also shows the failure status modal ("Booking Failed" / "Server is offline. Try again later.", **Okay** closes it). It is still logged to the console.

**Backend**

- `POST /ticket/book`, headers `Authorization: Bearer <token>` and `Content-Type: application/json`, `credentials: "include"`. Body: `{ userId: Number, scheduleId: Number, selectedSeat: ["A1","A4"] }`. Error responses carry `{ message }`.

**Back button:** `history.back()`.

### 4.5 My Bookings (`tickets.html`)

**Elements:** left sidebar (username `👤 name`, tabs ACTIVE / COMPLETED / CANCELLED, balance in ₱), main area with **booking cards**, floating "Back" button.

**On load**

- If `userId` is missing: shows "Please log in to view your tickets."
- `GET /ticket/mytickets?userId={userId}` with `Authorization: Bearer <token>`: array of tickets, each with `title`, `showDate`, `startTime`, `location`, `seatNumber`, `seatCategory`, `ticketCode`, `ticketStatus` (`ACTIVE`, `CANCELLED` or `COMPLETED`).
- `GET /user/getUser?userId={userId}` with `Authorization: Bearer <token>`: `username` (sidebar name) and `balance` (formatted as ₱ with 2 decimals). Failure shows "👤 Profile".
- Failures: "Failed to fetch tickets" or "Error loading tickets. Please try again later."

**Grouping:** tickets are grouped into one **booking card** per (title + date + time). The card header shows title, `📍 location | date at time` and a **seat count** for the current tab (e.g. "2 Active Seats ▼"). Click the header to **expand or collapse** the seat list (`open` class).

**Tabs (ACTIVE default):** clicking a tab hides all other-status seats. Cards with no seats of that status are hidden. The seat count updates. Known quirk: the COMPLETED tab shows all cards (cards stay visible but the seat rows are filtered); the redesign should make empty cards hide.

**Seat row:** `💺 Seat C4 (REGULAR)` + ticket code. ACTIVE rows have a **Cancel** button; other rows show a `CANCELLED` or `COMPLETED` tag.

**Flow: cancelling a ticket**

1. Click **Cancel**: browser `confirm("Ticket: <code>  Do you wish to cancel this booking? This action cannot be undone.")`.
2. OK: `PATCH /ticket/cancel`, headers `Authorization: Bearer <token>` and `Content-Type: application/json`, `credentials: "include"`, body `{ ticketCode }`.
3. Success: `alert("Ticket cancelled successfully.")`, then the list reloads (the balance is **not** reloaded; a refund may only show after a page refresh. Check this with the backend).
4. Failure: `alert("Error: <message>")`.

**Back button:** `history.back()`.

---

## 5. Admin screens (`admin.html`)

Layout: **left sidebar** (logo and "MJCinema / Boutique Cinema", nav items Home, Movies, Schedules, Bookings, Users, footer "⚙️ Settings" and "🚪 Logout") + **main content** that swaps by section (no page navigation). Active nav item is highlighted. All admin calls send `Authorization: Bearer <token>` and `Content-Type: application/json` unless noted. The page does not check the role or token on load.

### 5.1 Home (default on load)

Cards: **Total Sales**, **Total Bookings**, **Total Users**, **Today's Revenue**, plus a **Weekly Sales Trend** chart (canvas `#salesTrendChart`, uses a chart library; labels like "Wk of Dec 29").

| Data           | Endpoint                        | Response / formatting                                                               |
| -------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| Total sales    | `GET /ticket/totalSales`        | number, shown `₱1,234.00`                                                           |
| Total bookings | `GET /ticket/showTotalBookings` | number                                                                              |
| Total users    | `GET /user/showTotalUsers`      | number                                                                              |
| Revenue today  | `GET /ticket/showRevenueToday`  | number, shown as ₱                                                                  |
| Weekly trend   | `GET /ticket/getSalesTrend`     | object keyed by Monday date (`{ "2026-01-05": 12, ... }`), keys become chart labels |

Cards show "Loading..." then the value or "N/A" on failure. Clicking **Home** reloads the cards.

**Redesign:** the trend is drawn as plain CSS bars (no chart library) from `Object.entries` of the response, in response order, y axis scaled from the data. It reloads together with the cards. The chart has loading, empty (no keys) and error (with retry) states; legacy only logged the error.

### 5.2 Movies

On click: loads the movie leaderboard, active count and movie table.

| Data                        | Endpoint                     | Notes                                                                        |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Leaderboard (top 3, 🥇🥈🥉) | `GET /movie/leaderboard`     | array of `{ title, revenue }`; bar width = revenue relative to the top movie |
| Active movie count          | `GET /movie/showActiveCount` | `{ activeCount, totalCount }` (legacy showed `active/total`; the redesign shows `activeCount` only) |
| Movie table                 | `GET /movie/showMovieTable`  | array of `{ title, rating, releaseDate, status, revenue }`                   |

**Movie table:** columns #, Title, Rating (★ x.x), Release Date, Status pill, Revenue. Status pills: `NOW_SHOWING` ("Now Showing"), `COMING_SOON`, `INACTIVE`, `NEW`. States: Loading..., "No movies found.", "Failed to load." **Search box** filters by title live (client-side).

**Redesign notes (Movies):** the leaderboard shows numbered ranks (not medals) for every returned item. The movie table shows all rows. The TMDB search runs on Enter or the search icon in the field, as legacy (Enter or Search button). The modal has no Cancel or confirm button: clicking a result adds it. The toast shows a fixed title ("Movie added" / "Couldn't add movie") with the response text as its message. Result rows are disabled while the add request is in flight.

**Add Movie modal** (button "+ Add Movie"):

- Opens an overlay with a title search box (auto-focused) and the placeholder "Search for a movie to get started."
- Close: ✕ button, click outside, or **Esc**.
- **Search:** `GET /movie/tmdb/search?name=<query>` returns TMDB results (`id`, `title`, `release_date`, `vote_average`, `poster_path`). Shows cards with poster (placeholder 🎬 if none), title, year, ★ rating. States: "Searching...", "No results found.", "Search failed. Please try again."
- **Click a result:** `POST /movie/add`, body `{ id: <tmdbId> }`. The response is **plain text** (not JSON). The modal closes, a **toast** shows the text (success or error) and, on success, the table, count and leaderboard reload.

### 5.3 Schedules

On click: loads the best-showtime leaderboard, schedule count, average revenue and seat stats.

| Data                     | Endpoint                           | Notes                                                                                       |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Best showtimes (top 3)   | `GET /schedule/bestShowtime`       | array of `{ slot, averageRevenue }`; slot icons: 🌅 morning, ☀️ afternoon, 🌙 evening       |
| Total schedules          | `GET /schedule/showScheduleCount`  | number                                                                                      |
| Avg revenue per schedule | `GET /schedule/showAverageRevenue` | number, shown as ₱                                                                          |
| Seat stats table         | `GET /schedule/seatStats`          | array of `{ title, cinemaName, showDate, slot, occupiedSeats, availableSeats, percentage }` |

**Seat stats table:** columns #, Title, Cinema, Show Date, Slot (with icon), Occupied, Available, Occupancy bar and %. Bar colour (redesign, per design/system/tokens.md): green at 80% or more, gold at 50% or more, red below (legacy was 75% / 40% / grey). Best showtimes are labelled "By average revenue" and the gold bar is relative to the largest average revenue. Empty: "No active schedules found."

Two placeholder cards, "Stat 3" and "Stat 4", say "Coming soon".

**Add Schedule modal** (button "+ Add Schedule"):

- Opens an overlay and loads dropdown options in parallel:
  - Movies: `GET /movie/show` (value `movieId`, label `title`)
  - Cinemas: `GET /cinema/all` (value `cinemaId`, label `cinemaName — location`)
  - Slots: `GET /schedule/showSlots` (array of strings: MORNING, MIDDAY, AFTERNOON, EVENING, NIGHT, MIDNIGHT, with icons)
- Fields: movie, cinema, show date (date input), slot, **VIP price, Regular price, Balcony price**.
- Close: ✕, **Cancel**, or click outside. Closing clears the date and price fields. (Esc only closes the Add Movie modal.)
- **Add Schedule:** if any field is empty, an error toast "Please fill in all fields before submitting." Otherwise `POST /schedule/add`, body `{ movieId: Number, cinemaId: Number, showDate: "YYYY-MM-DD", slot, vipPrice: Number, regPrice: Number, balPrice: Number }`. The response is plain text. The modal closes, a toast shows the text and, on success, the seat stats, count, average revenue and leaderboard reload.

### 5.4 Bookings and Users: not implemented

Both sections are **empty containers** (`loadBookings()` and `loadUsers()` are commented out). See section 9.

### 5.5 Toast (admin)

Top-level popup: success (✅) or error (❌) with the message and a ✕ button, **auto-dismisses after 4s**, replaces any existing toast.

---

## 6. Every popup, overlay and transient UI

| #   | Name                                        | Where              | Trigger                                       | Contents                                             | Closes by                       |
| --- | ------------------------------------------- | ------------------ | --------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| 1   | Auth error banner                           | Login and Register | Failed validation or login                    | Red message + card shake                             | Auto after 3s                   |
| 2   | Status popup                                | Login and Register | Login success, register success, server error | Green or red message                                 | Auto after 3s                   |
| 3   | Profile dropdown                            | Dashboard          | Click profile icon                            | My Bookings, Profile, Logout                         | Click outside or the icon again |
| 4   | Movie modal                                 | Dashboard          | Click a movie card                            | Poster, title, rating, overview, showtime picker     | ✕ or Esc (not outside click); Back arrow on mobile |
| 5   | Showtime picker (inline in the movie modal) | Dashboard          | Open a Now Showing movie                      | Dropdown of showtimes, Select Seats                  | Part of the modal               |
| 6   | Browser alert: no showtime                  | Dashboard          | Select Seats with no choice                   | "Please select a time slot first!"                   | OK                              |
| 7   | Browser alert: no seats                     | Seat booking       | Confirm with no seats                         | "Please select atleast one seat."                    | OK                              |
| 8   | Confirm modal                               | Seat booking       | Confirm Booking                               | "Do you want to proceed...?" Go Back / Yes, Book Now | Either button                   |
| 9   | Status modal                                | Seat booking       | After booking call                            | Success or error card + Okay                         | Okay                            |
| 10  | Browser confirm: cancel ticket              | My Bookings        | Cancel on an active seat                      | Ticket code and warning                              | OK / Cancel                     |
| 11  | Browser alerts: cancel result               | My Bookings        | After cancel call                             | Success or error message                             | OK                              |
| 12  | Add Movie modal                             | Admin Movies       | + Add Movie                                   | TMDB search and result cards                         | ✕, outside click, Esc           |
| 13  | Add Schedule modal                          | Admin Schedules    | + Add Schedule                                | 7-field form                                         | ✕, Cancel, outside click        |
| 14  | Toast                                       | Admin              | Add movie or schedule result and validation   | Message                                              | Auto 4s or ✕                    |

The redesign may replace the browser `alert` and `confirm` popups (6, 7, 10, 11) with in-page components; the behaviour and messages stay.

## 7. End-to-end user flows

**Book a ticket**

1. Login, then Dashboard (Now Showing).
2. Click a movie card, which opens the Movie modal.
3. (Redesign: the schedules load when the modal opens and the picker is already shown; see section 10 item 11.) Legacy: click **Book Seats**, which loads the schedules and shows the dropdown.
4. Choose a showtime, then **Select Seats** (`selectedScheduleId` saved).
5. Seat page loads schedule, prices and occupied seats. Pick seats (total updates live).
6. **Confirm Booking**, then the confirm modal, then **Yes, Book Now**.
7. Status modal: success, **Okay**, back to the Dashboard; or failure, **Okay**, stay and pick again.
8. View it under Profile, then **My Bookings**, in the ACTIVE tab.

**Cancel a ticket:** Profile, My Bookings, expand a booking, **Cancel** on a seat, confirm, success alert, the list reloads (seat moves to the CANCELLED tab).

**Browse by cinema:** Dashboard, **Cinema** tab, click a cinema, see its movies, click a movie (modal, no booking button today), "← Back to Cinemas".

**Register then log in:** Login, **Register**, fill the form (validated), success popup, auto-redirect to Login, log in.

**Admin: add a movie:** Admin, Movies, **+ Add Movie**, search the TMDB title, click a result, toast, the table updates.

**Admin: add a schedule:** Admin, Schedules, **+ Add Schedule**, fill every field, submit, toast, stats update.

## 8. Backend call index (quick copy list)

Base: `https://mjcinema-backend-new.onrender.com` (set by `VITE_API_URL`; the old `https://mjcinema-backend.onrender.com` is no longer the default) (Bearer = `Authorization: Bearer <token>`)

| Method | Endpoint                             | Params / body                                                                            | Auth                  | Used on                                   |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------- |
| POST   | `/user/login`                        | `{username, password}`                                                                   | No                    | Login                                     |
| POST   | `/user/register`                     | `{username, password, confirm}`                                                          | No                    | Register                                  |
| GET    | `/movie/show`                        | none                                                                                     | No (Bearer on admin)  | Dashboard, Admin schedule form            |
| GET    | `/schedule/now-showing`              | none                                                                                     | No                    | Dashboard                                 |
| GET    | `/schedule/coming-soon`              | none                                                                                     | No                    | Dashboard                                 |
| GET    | `/schedule/movieSchedules/{movieId}` | path                                                                                     | No                    | Movie modal; Dashboard hero pick (one call per Now Showing movie) |
| GET    | `/cinema/all`                        | none                                                                                     | No (Bearer on admin)  | Dashboard Cinema tab, Admin schedule form |
| GET    | `/cinema/movies/{cinemaId}`          | path                                                                                     | No                    | Cinema detail                             |
| GET    | `/schedule/{scheduleId}`             | path                                                                                     | No                    | Seat booking                              |
| GET    | `/schedule/schedPrice/{scheduleId}`  | path                                                                                     | No                    | Seat booking                              |
| GET    | `/seat/occupied/{scheduleId}`        | path                                                                                     | Bearer                | Seat booking                              |
| POST   | `/ticket/book`                       | `{userId, scheduleId, selectedSeat[]}`                                                   | Bearer (+credentials) | Seat booking                              |
| GET    | `/ticket/mytickets`                  | `?userId=`                                                                               | Bearer                | My Bookings                               |
| PATCH  | `/ticket/cancel`                     | `{ticketCode}`                                                                           | Bearer (+credentials) | My Bookings                               |
| GET    | `/user/getUser`                      | `?userId=`                                                                               | Bearer                | My Bookings sidebar                       |
| GET    | `/ticket/totalSales`                 | none                                                                                     | Bearer                | Admin Home                                |
| GET    | `/ticket/showTotalBookings`          | none                                                                                     | Bearer                | Admin Home                                |
| GET    | `/user/showTotalUsers`               | none                                                                                     | Bearer                | Admin Home                                |
| GET    | `/ticket/showRevenueToday`           | none                                                                                     | Bearer                | Admin Home                                |
| GET    | `/ticket/getSalesTrend`              | none                                                                                     | Bearer                | Admin Home                                |
| GET    | `/movie/leaderboard`                 | none                                                                                     | Bearer                | Admin Movies                              |
| GET    | `/movie/showActiveCount`             | none                                                                                     | Bearer                | Admin Movies                              |
| GET    | `/movie/showMovieTable`              | none                                                                                     | Bearer                | Admin Movies                              |
| GET    | `/movie/tmdb/search`                 | `?name=`                                                                                 | Bearer                | Add Movie modal                           |
| POST   | `/movie/add`                         | `{id}` (TMDB id), plain-text response                                                    | Bearer                | Add Movie modal                           |
| GET    | `/schedule/bestShowtime`             | none                                                                                     | Bearer                | Admin Schedules                           |
| GET    | `/schedule/showScheduleCount`        | none                                                                                     | Bearer                | Admin Schedules                           |
| GET    | `/schedule/showAverageRevenue`       | none                                                                                     | Bearer                | Admin Schedules                           |
| GET    | `/schedule/seatStats`                | none                                                                                     | Bearer                | Admin Schedules                           |
| GET    | `/schedule/showSlots`                | none                                                                                     | Bearer                | Add Schedule modal                        |
| POST   | `/schedule/add`                      | `{movieId, cinemaId, showDate, slot, vipPrice, regPrice, balPrice}`, plain-text response | Bearer                | Add Schedule modal                        |

## 9. Not implemented / dead (decide per item in the redesign)

- Login: **Remember me** checkbox, **Forgot Password?** link (no behaviour).
- Dashboard profile dropdown: **Profile** item (no behaviour).
- Dashboard Cinema detail: movies open the modal as `soon`, so no Book Seats button.
- Admin: **Bookings** page and **Users** page (empty), sidebar **Settings** and **Logout** (no click handlers), the **"Stat 3" / "Stat 4"** "Coming soon" cards.
- `static/html/cinema.html`: unused standalone page.
- `static/js/main.js`: dead file, not loaded anywhere.
- No route guards: any page opens without logging in, and `admin.html` does not check the role.

## 10. Open decisions (fill in before or during the redesign)

Parity first: behaviour stays as documented. Improvements are a second pass after cutover.

1. Design extras with no data source are omitted: genre filter chips, genre / duration / rating label / cast / trailer, "Seats held" timer, trend percentages, Recent Bookings, period and date pickers, table paging and table filters, Export CSV, navbar search icon, poster thumbnails in My Bookings, cinema room names and "from ₱" prices. Only these are derived client-side: the hero movie (the Now Showing movie with the earliest upcoming schedule: one `GET /schedule/movieSchedules/{movieId}` per Now Showing movie, picking the smallest showDate + startTime that has not started yet, ties go to the earlier item in GET /schedule/now-showing, and if no movie has an upcoming schedule it falls back to the first item of GET /schedule/now-showing) and showtime grouping (by showDate, then cinema.location, then startTime).
2. Section 9 items: "Remember me" and "Forgot password?" render as in the design with no behaviour (as legacy). The "Profile" menu item has no behaviour. Admin "Settings" has no behaviour. Admin "Logout" does the same as the dashboard logout (clear localStorage, go to /). Admin Bookings and Users are "coming soon" empty states: no API calls, no fake data.
3. No route guards (parity with legacy).
4. Browser alert() and confirm() become in-page dialogs with the same messages.
5. The movie modal stays a modal (a full-screen sheet on mobile). Movies opened from the Cinema tab open it without booking, as legacy.
6. Seat pricing keeps the legacy rule: rows A-B VIP, rows G-H Balcony, every other row Regular. The legend text is generated from that rule and the prices come from GET /schedule/schedPrice. The design legend ("H-J") is sample data.
7. My Bookings: per-seat Cancel on ACTIVE rows (one PATCH /ticket/cancel per ticketCode). No booking-level cancel button. The balance is not reloaded after a cancel (as legacy).
8. Toast auto-dismiss is 5 seconds (design) instead of 4.
9. Routes: / (login), /register, /dashboard, /bookseat, /tickets, /admin, /admin/movies, /admin/schedules, /admin/bookings, /admin/users. Legacy redirect targets map to these (/index.html -> /, /html/dashboard.html -> /dashboard, and so on).
10. Seat booking, network error (the server cannot be reached while booking): shows the failure status modal with the title "Booking Failed" and the message "Server is offline. Try again later." (the same wording as login and register). The selected seats are kept and **Okay** only closes it. The error is still logged to the console as before. Decided by the project owner after the first migration pass.
11. Movie modal (design 4.3-movie-modal): there is no "Book Seats" button. For Now Showing movies `GET /schedule/movieSchedules/{movieId}` is called as soon as the modal opens and the showtime picker is always visible, with "Select seats" in a sticky footer (disabled-looking until a showtime is chosen; clicking it with none chosen shows "Please select a time slot first!" in the footer). Coming Soon and Cinema-tab movies show no picker. The hero's "Book seats" opens the modal scrolled to the picker. Esc closes the modal (an e2e test covers it); an outside click does not.
12. Admin Schedules: the legacy "Stat 3" / "Stat 4" "Coming soon" placeholder cards are not rebuilt (no data, no behaviour).
13. The seat-booking confirm dialog also closes on Esc or an outside click, which is the same as **Go Back** (it never submits).
14. `PATCH /ticket/cancel`: the body of a successful response is ignored (read as text), as legacy never read it. `GET /movie/showActiveCount` returns `{ activeCount, totalCount }` (legacy showed `active/total`; the redesign shows `activeCount`).

## 11. Redesign rules

1. **Do not change behaviour, API calls, parameters, `localStorage` keys or redirects** unless an item in section 10 has been decided.
2. Keep the element ids and function names that JS depends on, or update the JS together with the HTML in the same change. Several handlers are inline `onclick` calls bound to `window.*` functions.
3. Fix the duplicate ids (`now-showing`, `coming-soon`, `movie-grid` on the dashboard; `home`, `movies`, `bookings`, `users` on the admin nav) when touching those files.
4. Every data screen needs loading, empty and error states. The backend can take a minute to wake up.
5. Must work at mobile width (the current dashboard nav overflows at 390px).
6. Visual decisions (palette, fonts, components): _to be filled in by the project owner._

---

## 12. Paragraph for CLAUDE.md

```
## Frontend redesign
Before editing anything in the frontend (HTML, CSS or JS under `static/`), read `frontend-redesign.md` in the project root first. It is the source of truth for every screen, popup, user flow, `localStorage` key and backend call (with parameters). The backend is finished and connected, so redesign work must be design-only: keep all behaviours, API calls and flows listed there working. If a requested change would alter behaviour or conflicts with that file, or you are unsure how something should look or work, ask the user before editing. When you do change behaviour or add or remove a screen, popup or API call, update `frontend-redesign.md` in the same change.
```
