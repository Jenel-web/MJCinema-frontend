import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { logout, setUnauthorizedHandler } from './api'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Login and Register are the entry screens, so they stay in the main bundle.
// Everything after login is split per route and downloaded when first visited.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const BookSeatPage = lazy(() => import('./pages/BookSeatPage'))
const TicketsPage = lazy(() => import('./pages/TicketsPage'))
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'))
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'))
const AdminMoviesPage = lazy(() => import('./pages/admin/AdminMoviesPage'))
const AdminSchedulesPage = lazy(() => import('./pages/admin/AdminSchedulesPage'))
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))

// Dev-only route: the condition is statically replaced at build time, so production drops it.
const StyleguidePage = import.meta.env.DEV ? lazy(() => import('./pages/StyleguidePage')) : null

/** Themed blank page while a route chunk downloads, so there is no white flash. */
function RouteFallback() {
  return <div className="min-h-dvh bg-bg" />
}

export default function App() {
  const navigate = useNavigate()

  // The backend answered 401 (no token, or it expired): same as a logout, then the login page says why.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout() // localStorage.clear()
      navigate('/', { replace: true, state: { sessionExpired: true } })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookseat" element={<BookSeatPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHomePage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="schedules" element={<AdminSchedulesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
        {StyleguidePage && <Route path="/styleguide" element={<StyleguidePage />} />}
      </Routes>
    </Suspense>
  )
}
