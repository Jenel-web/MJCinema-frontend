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
