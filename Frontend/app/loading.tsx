'use client'

import { motion } from 'framer-motion'
import { Layers, Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md text-foreground">
      {/* Outer ambient glow ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute size-28 rounded-full bg-blue-500/25 blur-xl"
        />

        {/* Central Floating Layers Icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative flex size-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-zinc-900/90 p-4 shadow-[0_0_25px_rgba(59,130,246,0.35)]"
        >
          <Layers className="size-8 text-blue-400" />
          <motion.div
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="size-4 text-blue-300" />
          </motion.div>
        </motion.div>
      </div>

      {/* Fading text & pulse indicator */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <motion.p
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-sm font-medium tracking-wide text-zinc-200"
        >
          Synchronizing Knowledge Layer...
        </motion.p>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="size-1.5 rounded-full bg-blue-500"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
