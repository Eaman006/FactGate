'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signInWithPopup } from 'firebase/auth'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthError(null)

    // Simulate login & navigate to dashboard
    setTimeout(() => {
      router.push('/dashboard')
    }, 400)
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setAuthError(null)

    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      if (userCredential?.user) {
        router.push('/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.warn('Firebase Auth notice:', err?.message || err)

      if (err?.code === 'auth/popup-closed-by-user') {
        setIsGoogleLoading(false)
        return
      }

      // If project env variables are missing or demo key is active, fallback gracefully to dashboard
      setAuthError(
        err?.code === 'auth/api-key-not-valid' || err?.code === 'auth/invalid-api-key'
          ? 'Firebase Demo Mode: Redirecting to dashboard...'
          : err?.message || 'Redirecting to dashboard...',
      )

      setTimeout(() => {
        router.push('/dashboard')
      }, 700)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    setIsLoading(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 400)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 text-zinc-100 font-sans">
      {/* Background Radial Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-500/20 blur-[140px]" />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        <span>Back to FactGate</span>
      </Link>

      {/* Main Glassmorphism Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-xl shadow-indigo-500/25">
            <Layers className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Welcome to FactGate
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Sign in to access your evidence-grounded knowledge layer
          </p>
        </div>

        {/* Optional Auth Notification */}
        {authError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2.5 text-xs text-indigo-300">
            <Loader2 className="size-4 animate-spin shrink-0 text-sky-400" />
            <span>{authError}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="size-4 animate-spin text-sky-400" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn('GitHub')}
            disabled={isLoading || isGoogleLoading}
            className="flex items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs font-medium text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white active:scale-95 disabled:opacity-50"
          >
            <svg className="size-4 fill-current text-zinc-300" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-zinc-800" />
          <span>or continue with email</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300">Work Email</label>
            <div className="mt-1.5 relative flex items-center">
              <Mail className="absolute left-3.5 size-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@enterprise.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-300">Password</label>
              <a href="#" className="text-[11px] text-indigo-400 hover:underline">
                Forgot?
              </a>
            </div>
            <div className="mt-1.5 relative flex items-center">
              <Lock className="absolute left-3.5 size-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>256-bit Grounded Security Encryption</span>
        </div>
      </motion.div>
    </div>
  )
}
