import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Tiny loader hook: { status, data, error, reload, setData }.
 * Keeps the previous data visible while reloading, so tables do not flash.
 */
export function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ status: immediate ? 'loading' : 'idle', data: null, error: null })
  const mounted = useRef(true)
  const seq = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    const ticket = ++seq.current
    setState((prev) => ({ ...prev, status: prev.data ? 'refreshing' : 'loading', error: null }))
    try {
      const data = await loader()
      if (!mounted.current || ticket !== seq.current) return data
      setState({ status: 'ready', data, error: null })
      return data
    } catch (error) {
      if (!mounted.current || ticket !== seq.current) return null
      setState((prev) => ({ ...prev, status: 'error', error }))
      return null
    }
  }, deps)

  useEffect(() => {
    if (immediate) reload()
  }, [reload, immediate])

  return {
    ...state,
    reload,
    setData: (data) => setState({ status: 'ready', data, error: null }),
  }
}
