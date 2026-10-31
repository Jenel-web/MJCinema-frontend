## Frontend redesign (legacy to React migration)

- `static/` is the LEGACY frontend. Treat it as read-only reference; do not edit it unless I ask.
- The new app lives in `web/` (Vite + React + TypeScript + Tailwind). All new frontend work goes there.
- Before editing `web/`, read `frontend-redesign.md`. It is the source of truth for every screen, popup, flow, localStorage key and backend call. Design references are in `design/`.
- The migration is design-only: keep behaviours, API calls (method, URL, params, headers, credentials), localStorage keys (`token`, `userId`, `username`, `movieId`, `selectedScheduleId`) and redirects identical to the md. Known quirks stay as they are unless section 10 records a decision.
- All backend calls go through `web/src/api/` only. The backend is in another repo: never invent endpoints or fields.
- Use only shared components in `web/src/components/ui` and theme tokens; no ad-hoc colors.
- Do not port dead code (`static/js/main.js`, `static/html/cinema.html`).
- A screen is done only when it matches its design image, every call in its md section is made with identical params, and loading/empty/error states exist.
- If a change would alter behaviour or conflicts with the md, ask first. If behaviour changes, update the md in the same change.

## Screen migration protocol
For every screen, in this order:
1. Read: the screen's section(s) in frontend-redesign.md (including section 10 decisions), the design images named in the prompt, design/system/tokens.md, and the legacy files named in the prompt.
2. Build in web/ using only the shared components in web/src/components/ui and the web/src/api layer. Posters come from https://image.tmdb.org/t/p/w500 + movie.poster. Never use the gradient placeholder posters from the design.
3. The design images contain sample data (movie names, genres, prices, users, dates). Never hardcode it. If a design element has no data source in the md or the API (genre, duration, rating label, cast, trailer, timers, trend percentages, etc.), omit it and list it in your report. Do not invent endpoints or response fields.
4. Every data view needs loading (skeleton), empty and error states in the style of design/screens/4.3-dashboard-states.png. Layouts must work at 1440 and 390 widths.
5. Verify before reporting: tsc and build pass with no errors; run the app; use Playwright to screenshot at 1440 and 390 wide and compare with the design image; fix visible differences.
6. Final report: (a) a table with every API call in the md section, the function that makes it, and whether the params match; (b) the localStorage keys read or written; (c) design elements you omitted and why; (d) any place where behaviour differs from the md. Do not touch other screens.

## Future considerations
Not part of the current migration. Do not build these unless asked.
- Coming Soon page: the design has no Now showing / Coming soon pill toggle there, so the page is built exactly as designed (the toggle only appears on the Now Showing page). On desktop, Coming Soon is therefore reachable only from the navbar link. On mobile the second row of nav links covers it. Consider adding the toggle to the Coming Soon page later so users can switch back without the navbar.
- Cinema list "N movies now playing" count: the design shows it on every cinema card, but `GET /cinema/all` returns only `cinemaId`, `cinemaName`, `location`, so the cards omit it for now (the detail view does show the count, from the length of `GET /cinema/movies/{cinemaId}`). Two ways to add it later:
  - Frontend only: call `GET /cinema/movies/{cinemaId}` once per cinema when the list loads and show the array length.
    - Drawbacks: one extra request per cinema on every visit to the Cinema tab (the list refetches each time the tab is entered); the cards would need a per-card loading state and a per-card error state; the Render backend can be slow to wake up, so the counts may appear late or fail independently of the list; the endpoint returns full movie objects (not just a count), so most of the payload is thrown away; the number of requests grows with the number of cinemas.
  - Backend field: add a `movieCount` (or similar) to the `GET /cinema/all` response and read it in the frontend.
    - Drawbacks: needs a change in the separate backend repo and a deploy before the frontend can use it; the frontend must handle the field being missing until then, and the count must use the same rule as `/cinema/movies/{cinemaId}` (which includes Coming Soon movies, so "now playing" could be misleading) or the two numbers will disagree.
  - Either way, decide first what "now playing" counts: today the cinema detail view lists every movie returned for that cinema, including ones whose status is Coming soon.