'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  FileSearch,
  FileText,
  GitCompare,
  Layers,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const floatingIcons = [
  { icon: FileText, top: '15%', left: '8%', delay: 0, duration: 6 },
  { icon: ShieldCheck, top: '22%', right: '10%', delay: 1, duration: 7 },
  { icon: Database, top: '60%', left: '6%', delay: 2, duration: 6.5 },
  { icon: Sparkles, top: '65%', right: '8%', delay: 0.5, duration: 5.5 },
]

// 3D Mouse Tilt Card Component for Features
function FeatureTiltCard({
  icon: Icon,
  title,
  subtitle,
  description,
  badge,
  gradient,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  description: string
  badge: string
  gradient: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [12, -12])
  const rotateY = useTransform(x, [-100, 100], [-12, 12])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20"
    >
      {/* Background Hover Radial Glow */}
      <div
        className={`pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient} blur-xl`}
      />

      <div style={{ transform: 'translateZ(30px)' }} className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex size-13 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/90 text-sky-400 shadow-md">
            <Icon className="size-6" />
          </div>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-300">
            {badge}
          </span>
        </div>

        <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-sky-400">{subtitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{description}</p>
      </div>
    </motion.div>
  )
}

// 3D Isometric Floating Layer Component for Architecture
function IsometricArchitecture() {
  return (
    <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center py-10 md:py-16">
      {/* Desktop Isometric View */}
      <div
        className="relative hidden w-full max-w-2xl h-[520px] md:flex items-center justify-center"
        style={{ perspective: 1200 }}
      >
        <div
          className="relative w-full max-w-lg flex flex-col items-center justify-center"
          style={{
            transform: 'rotateX(55deg) rotateZ(-35deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Layer 3: Gemini LLM (Top) */}
          <motion.div
            animate={{ y: [0, -18, 0] }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 0,
            }}
            style={{ transform: 'translateZ(120px)' }}
            className="w-full rounded-2xl border border-purple-500/40 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-purple-400/80"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Gemini 2.5 Flash Engine</h4>
                  <p className="text-[11px] text-purple-300">Semantic Grounding & Verification</p>
                </div>
              </div>
              <span className="rounded-full bg-purple-500/20 px-2.5 py-1 font-mono text-[10px] text-purple-300">
                LLM Layer
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300">
              <div className="rounded border border-purple-500/20 bg-purple-950/40 p-2 text-center">
                Strict Schema
              </div>
              <div className="rounded border border-purple-500/20 bg-purple-950/40 p-2 text-center">
                Verbatim Quotes
              </div>
              <div className="rounded border border-purple-500/20 bg-purple-950/40 p-2 text-center">
                Confidence Score
              </div>
            </div>
          </motion.div>

          {/* Layer 2: Flask API (Middle) */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 5.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 0.4,
            }}
            style={{ transform: 'translateZ(60px)' }}
            className="w-full -mt-6 rounded-2xl border border-sky-500/40 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-sky-400/80"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                  <Server className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Flask Python Service</h4>
                  <p className="text-[11px] text-sky-300">Ingestion, Extraction & SQLite Persistence</p>
                </div>
              </div>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-1 font-mono text-[10px] text-sky-300">
                REST :5000
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300">
              <div className="rounded border border-sky-500/20 bg-sky-950/40 p-2 text-center">
                PyPDF Extraction
              </div>
              <div className="rounded border border-sky-500/20 bg-sky-950/40 p-2 text-center">
                SQLite Storage
              </div>
              <div className="rounded border border-sky-500/20 bg-sky-950/40 p-2 text-center">
                Static PDF Host
              </div>
            </div>
          </motion.div>

          {/* Layer 1: Next.js Frontend (Bottom) */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 0.8,
            }}
            style={{ transform: 'translateZ(0px)' }}
            className="w-full -mt-6 rounded-2xl border border-indigo-500/40 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:border-indigo-400/80"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Next.js 16 Frontend</h4>
                  <p className="text-[11px] text-indigo-300">High-Density Knowledge Layer UI</p>
                </div>
              </div>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 font-mono text-[10px] text-indigo-300">
                React 19 App
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300">
              <div className="rounded border border-indigo-500/20 bg-indigo-950/40 p-2 text-center">
                Fact Explorer
              </div>
              <div className="rounded border border-indigo-500/20 bg-indigo-950/40 p-2 text-center">
                Command Palette
              </div>
              <div className="rounded border border-indigo-500/20 bg-indigo-950/40 p-2 text-center">
                PDF Deep Linker
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Stacked Card View Fallback */}
      <div className="grid w-full gap-4 md:hidden">
        <div className="rounded-2xl border border-purple-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Gemini 2.5 Flash Layer</h4>
              <p className="text-xs text-purple-300">Semantic Grounding Engine</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Server className="size-5 text-sky-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Flask Python Backend</h4>
              <p className="text-xs text-sky-300">Extraction & PDF Hosting</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-zinc-900/80 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Layers className="size-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Next.js 16 Frontend</h4>
              <p className="text-xs text-indigo-300">Interactive Knowledge Explorer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STATS = [
  { value: '99.4%', label: 'Fact Precision' },
  { value: '< 2s', label: 'Processing Latency' },
  { value: '100%', label: 'Verbatim Grounded' },
  { value: 'Zero', label: 'Unverified Hallucinations' },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Glow Orbs & Background Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/30 via-sky-500/20 to-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-[40%] right-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-[-5%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[150px]" />

      {/* Floating Animated Background Icons */}
      {floatingIcons.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div
            key={index}
            className="pointer-events-none absolute hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-3.5 shadow-2xl backdrop-blur-md lg:block"
            style={{ top: item.top, left: item.left, right: item.right }}
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: item.duration,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: item.delay,
            }}
          >
            <Icon className="size-6 text-zinc-400" />
          </motion.div>
        )
      })}

      {/* Header Navigation with Smooth Anchor Links */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 font-bold text-white shadow-lg shadow-indigo-500/25">
              <Layers className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              FactGate
              <span className="ml-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                v2.0
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#architecture" className="transition-colors hover:text-white">
              Architecture
            </a>
            <a href="#benchmark" className="transition-colors hover:text-white">
              Benchmark
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-20 md:pt-28 md:pb-28">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Top Pill Badge */}
          <motion.div variants={fadeUpVariants} className="inline-flex">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md">
              <Sparkles className="size-3.5 text-indigo-400 animate-pulse" />
              <span>Evidence-Grounded Knowledge Engine</span>
            </div>
          </motion.div>

          {/* Staggered Hero Headline */}
          <motion.h1
            variants={fadeUpVariants}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-none lg:text-7xl"
          >
            Stop Guessing.{' '}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Start Grounding.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl sm:leading-8 max-w-2xl mx-auto"
          >
            FactGate extracts, verifies, and reconciles structured claims across complex PDF documents. Eliminate hallucinations with verbatim quote evidence.
          </motion.p>

          {/* Hero CTA */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/login"
              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/40 active:scale-95 sm:w-auto"
            >
              <span>Get Started Free</span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Feature Badges below Hero */}
          <motion.div
            variants={fadeUpVariants}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Zero-Setup PDF Parser</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Gemini 2.5 Flash Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Realtime Conflict Matrix</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Section 2: Features Section with 3D Tilt Cards */}
      <section id="features" className="relative px-6 py-24 md:py-32 border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
              Interactive Features
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Precision 3D Knowledge Intelligence
            </p>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base">
              Hover over the cards to explore our deterministic extraction and reconciliation engine.
            </p>
          </div>

          {/* 3D Tilt Cards Grid */}
          <div className="grid gap-8 md:grid-cols-3" style={{ perspective: 1000 }}>
            <FeatureTiltCard
              icon={FileSearch}
              title="Automated Extraction"
              subtitle="PDF Parsing & Grounded Quotes"
              description="Ingest unstructured documents and extract structured, normalized claims automatically linked to verbatim source quotes and page numbers."
              badge="Extraction Engine"
              gradient="from-sky-500/20 via-blue-600/10 to-transparent"
            />

            <FeatureTiltCard
              icon={GitCompare}
              title="Cross-Doc Reconciliation"
              subtitle="Corroboration & Conflict Resolution"
              description="Compare extracted facts across multiple sources. Automatically surface corroborations, material contradictions, and temporal context differences."
              badge="Matrix Engine"
              gradient="from-emerald-500/20 via-teal-600/10 to-transparent"
            />

            <FeatureTiltCard
              icon={Sparkles}
              title="LLM Reasoning"
              subtitle="Gemini 2.5 Semantic Intelligence"
              description="Leverage Gemini AI models to analyze claim context, calculate confidence scores, and deliver human-auditable reasoning for every relationship."
              badge="Gemini AI"
              gradient="from-purple-500/20 via-indigo-600/10 to-transparent"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Architecture Section with Isometric 3D Layer Stack */}
      <section id="architecture" className="relative px-6 py-24 md:py-32 border-t border-zinc-800/60 bg-zinc-950/80">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              System Architecture
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              3D Isometric Stack Flow
            </p>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base">
              An end-to-end decoupled architecture designed for high throughput and zero hallucination risk.
            </p>
          </div>

          {/* Isometric Floating Stack */}
          <IsometricArchitecture />
        </div>
      </section>

      {/* Section 4: Benchmark Section */}
      <section id="benchmark" className="border-t border-zinc-800/60 bg-zinc-900/30 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Performance Benchmark
            </h2>
            <p className="mt-2 text-2xl font-bold text-white">Engineered for absolute accuracy</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-mono text-3xl font-extrabold text-white md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-indigo-400" />
            <span className="font-medium text-zinc-400">FactGate Knowledge Layer</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-zinc-300 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-zinc-300 transition-colors">
              Architecture
            </a>
            <a href="#benchmark" className="hover:text-zinc-300 transition-colors">
              Benchmark
            </a>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
