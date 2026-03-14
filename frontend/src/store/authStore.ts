import { create } from 'zustand'
import api from '../utils/api'

interface User { id: string; name: string; email: string }

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,

  init: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) set({ token, user: JSON.parse(user) })
  },

  login: async (email, password) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    const res = await api.post('/auth/login', form)
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token: access_token, user })
  },

  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    const { access_token, user } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token: access_token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  }
}))
