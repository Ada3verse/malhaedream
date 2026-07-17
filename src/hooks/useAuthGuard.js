import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '../utils/auth'

export function useAuthGuard(requiredRole) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = getStoredUser()
    if (!stored || (requiredRole && stored.role !== requiredRole)) {
      navigate('/', { replace: true })
      return
    }
    setUser(stored)
  }, [navigate, requiredRole])

  return user
}
