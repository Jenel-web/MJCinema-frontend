import { Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import BookSeatPage from './pages/BookSeatPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TicketsPage from './pages/TicketsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/bookseat" element={<BookSeatPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
