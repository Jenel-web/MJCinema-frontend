import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, validateRegister } from '../api'
import { AuthLayout, Banner, Button, Input, useToast } from '../components/ui'
import { CheckIcon } from '../components/ui/icons'
import { cn } from '../lib/cn'
import { useAuthFeedback, useSlowHint } from '../lib/useAuthFeedback'

const REDIRECT_MS = 2000 // legacy: success redirects to login after 2s
const POPUP_MS = 3000 // legacy: status popup auto-hides after 3s
const SUCCESS_MESSAGE = 'Account Created. Redirecting...'

/** Live hint mirroring the two client-side rules. Informational only: never blocks submit. */
function Rule({ met, children }: { met: boolean; children: string }) {
  return (
    <li className={cn('flex items-center gap-2 text-[13px] leading-[18px]', met ? 'text-ok' : 'text-mu')}>
      <span className="flex size-4 items-center justify-center">
        {met ? <CheckIcon /> : <span className="size-1.5 rounded-full bg-mu" />}
      </span>
      {children}
    </li>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { error, shaking, showError, clearError } = useAuthFeedback()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const slow = useSlowHint(loading)

  // Do not redirect if the user leaves the page first.
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    },
    [],
  )

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading || created) return
    clearError() // legacy clearFeedback()

    // Legacy order: mismatch first, then length. Both show the banner (and shake the card).
    const invalid = validateRegister(password, confirm)
    if (invalid) {
      showError(invalid)
      return
    }

    setLoading(true)
    const result = await register(username, password, confirm)
    setLoading(false)

    if (result.success) {
      setCreated(true)
      redirectTimer.current = setTimeout(() => navigate('/'), REDIRECT_MS)
      return
    }
    // Legacy: red popup with the server's message (or the offline message).
    toast.show({ type: 'error', title: result.message, duration: POPUP_MS })
  }

  return (
    <AuthLayout
      title="Create account"
      headline={
        <>
          Join the <br className="hidden md:block" />
          front row.
        </>
      }
      description="One account for every cinema. Book seats in under a minute and keep every ticket in one place."
      art={[160, 340, 32]}
      cardClassName={shaking ? 'animate-shake' : undefined}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {created ? (
          <Banner tone="success">{SUCCESS_MESSAGE}</Banner>
        ) : (
          error && <Banner tone="error">{error}</Banner>
        )}

        <Input
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={created}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={created}
        />
        <Input
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={created}
        />

        <ul aria-label="Password requirements" className="-mt-1 flex flex-col gap-1.5">
          <Rule met={password.length >= 8}>At least 8 characters</Rule>
          <Rule met={confirm.length > 0 && password === confirm}>Matches the confirmation</Rule>
        </ul>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" fullWidth loading={loading} disabled={created}>
            Join
          </Button>
          <p aria-live="polite" className="min-h-5 text-center text-[13px] text-mu">
            {slow && 'Waking up the server. Creating your account can take up to a minute.'}
          </p>
        </div>

        <p className="text-center text-sm text-mu">
          Already a member?{' '}
          <Link to="/" className="font-semibold text-tx underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
