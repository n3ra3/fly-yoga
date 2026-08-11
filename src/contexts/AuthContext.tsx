import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  role: UserRole
  isAdmin: boolean
  isTrainer: boolean
  /** id карточки тренера (trainers.id), если пользователь — тренер */
  trainerId: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (params: SignUpParams) => Promise<SignUpResult>
  /** подтверждение регистрации 6-значным кодом из письма */
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>
  /** повторно отправить код на почту */
  resendCode: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

interface SignUpParams {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

interface SignUpResult {
  error: string | null
  /** аккаунт с такой почтой уже зарегистрирован */
  alreadyExists: boolean
  /** есть сессия = подтверждение email выключено, пользователь сразу вошёл */
  hasSession: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trainerId, setTrainerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setTrainerId(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)

    if (data?.role === 'trainer') {
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle()
      setTrainerId(trainer?.id ?? null)
    } else {
      setTrainerId(null)
    }

    setIsLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp({ email, password, firstName, lastName, phone }: SignUpParams): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone: phone ?? null },
      },
    })

    if (error) {
      // когда подтверждение email выключено, Supabase явно сообщает о дубле
      if (/already registered|already exists/i.test(error.message)) {
        return { error: null, alreadyExists: true, hasSession: false }
      }
      return { error: error.message, alreadyExists: false, hasSession: false }
    }

    // когда подтверждение включено, Supabase маскирует дубль:
    // возвращает user с пустым массивом identities
    const alreadyExists = !!data.user && (data.user.identities?.length ?? 0) === 0

    return { error: null, alreadyExists, hasSession: !!data.session }
  }

  async function verifyCode(email: string, code: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    return { error: error?.message ?? null }
  }

  async function resendCode(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error: error?.message ?? null }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        role: (profile?.role ?? 'user') as UserRole,
        isAdmin: profile?.role === 'admin',
        isTrainer: profile?.role === 'trainer',
        trainerId,
        signIn,
        signUp,
        verifyCode,
        resendCode,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
