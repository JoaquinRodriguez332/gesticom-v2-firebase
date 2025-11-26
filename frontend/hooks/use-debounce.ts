// hooks/use-debounce.ts
import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores
 * Útil para búsquedas en tiempo real
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * 
 * useEffect(() => {
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}