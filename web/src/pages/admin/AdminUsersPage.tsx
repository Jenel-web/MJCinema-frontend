import AdminPageHeader from '../../features/admin/AdminPageHeader'
import NotAvailableCard from '../../features/admin/NotAvailableCard'

/**
 * "Coming soon" (frontend-redesign.md 5.4 and section 10.2): no API calls, no sample data.
 * The proposed design (design/screens/5.4-admin-users.png) needs a backend endpoint that returns
 * all users, each with username, join date, booking count and balance.
 */
export default function AdminUsersPage() {
  return (
    <>
      <AdminPageHeader title="Users" />
      <NotAvailableCard description="User management isn't available yet. It will show up here once the server can list all users." />
    </>
  )
}
