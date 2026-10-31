import { useCallback, useEffect, useState } from 'react'
import type { ApiResult } from '../../api'

export type Resource<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: T }

/**
 * Runs one API call on mount and whenever `reloadKey` changes.
 * An HTTP error or a thrown network failure is `error` (legacy showed "N/A" / "Failed to load").
 * `reload()` re-runs just this call.
 */
export function useApiResource<T>(
  fetcher: () => Promise<ApiResult<T>>,
  reloadKey?: unknown,
): [Resource<T>, () => void] {
  const [state, setState] = useState<Resource<T>>({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetcher()
      .then((res) => {
        if (!cancelled) setState(res.ok ? { status: 'ok', data: res.data } : { status: 'error' })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
    // fetcher is a stable module-level function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, retry])

  const reload = useCallback(() => setRetry((n) => n + 1), [])
  return [state, reload]
}
