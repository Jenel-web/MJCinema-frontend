import AdminPageHeader from '../../features/admin/AdminPageHeader'
import NotAvailableCard from '../../features/admin/NotAvailableCard'

/**
 * "Coming soon" (frontend-redesign.md 5.4 and section 10.2): no API calls, no sample data.
 * The proposed design (design/screens/5.4-admin-bookings.png) needs a backend endpoint that returns
 * all bookings, each with customer, showtime (movie, cinema, date, time), seats, amount and status.
 */
export default function AdminBookingsPage() {
  return (
    <>
      <AdminPageHeader title="Bookings" />
      <NotAvailableCard description="Booking management isn't available yet. It will show up here once the server can list all bookings." />
    </>
  )
}
