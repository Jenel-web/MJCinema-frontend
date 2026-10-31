import { useRef, useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authErrors, login, postLoginPath } from '../api'
import { AuthLayout, Banner, Button, Checkbox, Input, useToast } from '../components/ui'
import { EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { useAuthFeedback, useSlowHint } from '../lib/useAuthFeedback'

export default function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const passwordRef = useRef<HTMLInputElement>(null)
  const { error, shaking, showError, clearError } = useAuthFeedback()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const slow = useSlowHint(loading)

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    clearError() // legacy clearFeedback()
    setLoading(true)

    // Legacy sends whatever is typed (no client-side validation on login).
    const result = await login(username, password)
    setLoading(false)

    if (result.success) {
      // Legacy: green popup "Login successful!" (3s), then USER -> dashboard, anything else -> admin.
      toast.show({ type: 'success', title: 'Login successful!', duration: 3000 })
      navigate(postLoginPath(result.data.role))
      return
    }

    // Legacy: only the offline message is shown as-is; every other failure is "Invalid Username or Password."
    showError(result.message === authErrors.OFFLINE ? authErrors.OFFLINE : authErrors.INVALID)
    passwordRef.current?.focus()
  }

  return (
    <AuthLayout
      title="Sign in"
      headline={
        <>
          Your seat <br className="hidden md:block" />
          is waiting.
        </>
      }
      description="Sign in to book seats, see your tickets and pick tonight's showtime."
      art={[2, 275, 32]}
      cardClassName={shaking ? 'animate-shake' : undefined}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {error && <Banner tone="error">{error}</Banner>}

        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          ref={passwordRef}
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className="inline-flex size-9 items-center justify-center rounded-full text-lg text-mu transition duration-150 ease-out hover:text-tx"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-4">
          {/* Not implemented in the legacy app either: both do nothing. */}
          <Checkbox label="Remember me" defaultChecked />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm font-medium text-tx underline underline-offset-4"
          >
            Forgot password?
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Log in
          </Button>
          <p aria-live="polite" className="min-h-5 text-center text-[13px] text-mu">
            {slow && 'Waking up the server. The first login can take up to a minute.'}
          </p>
        </div>

        <p className="text-center text-sm text-mu">
          New to MJCinema?{' '}
          <Link to="/register" className="font-semibold text-tx underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
