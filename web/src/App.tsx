import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import BookSeatPage from './pages/BookSeatPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TicketsPage from './pages/TicketsPage'

// Dev-only route: the condition is statically replaced at build time, so production drops it.
const StyleguidePage = import.meta.env.DEV ? lazy(() => import('./pages/StyleguidePage')) : null

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/bookseat" element={<BookSeatPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      {StyleguidePage && (
        <Route
          path="/styleguide"
          element={
            <Suspense fallback={null}>
              <StyleguidePage />
            </Suspense>
          }
        />
      )}
    </Routes>
  )
}
