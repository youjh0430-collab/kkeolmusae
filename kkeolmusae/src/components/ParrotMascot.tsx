"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MascotVariant = 'full' | 'face' | 'avatar' | 'icon';

export default function ParrotMascot({ 
  className = "", 
  emotion = 'default',
  variant = 'avatar',
  stateOverride
}: { 
  className?: string, 
  emotion?: 'default' | 'sad' | 'excited' | 'mocking',
  variant?: MascotVariant,
  stateOverride?: 'idle' | 'happy' | 'sad' | 'thinking'
}) {
  
  type SvgState = 'idle' | 'happy' | 'sad' | 'shocked' | 'mocking' | 'thinking';
  const stateMap: Record<string, SvgState> = {
    default: 'idle',
    sad: 'sad',
    excited: 'happy',
    mocking: 'mocking',
    shocked: 'shocked',
  };
  const state: SvgState = (stateOverride as SvgState) ?? stateMap[emotion] ?? 'idle';

  const isIcon = variant === 'icon';

  return (
    <motion.div 
      className={cn("relative", !isIcon && "mx-auto", className, variant === 'avatar' ? 'w-32 h-32' : isIcon ? 'w-8 h-8' : 'w-48 h-48')}
      animate={isIcon ? {} : state === 'thinking' ? { y: [-5, 5, -5] } : { y: [0, -10, 0] }}
      transition={{ duration: state === 'thinking' ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {!isIcon && <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl" />}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className={cn("w-full h-full", !isIcon && "drop-shadow-lg scale-110")}>
          <motion.circle cx="50" cy="50" r="45" fill="#FF6B35" initial={{ scale: 0 }} animate={{ scale: 1 }} />
          
          {/* Beak */}
          {state === 'shocked' ? (
            <>
              <path d="M45 52 L55 52 L50 65 Z" fill="#FFB347" />
              <path d="M47 68 L53 68 L50 78 Z" fill="#F59E0B" />
            </>
          ) : (
            <path d="M45 55 L55 55 L50 75 Z" fill="#FFB347" />
          )}

          {/* Eyes & Expressions */}
          {state === 'idle' && (
            <>
              <circle cx="35" cy="40" r="5" fill="white" />
              <circle cx="65" cy="40" r="5" fill="white" />
              <circle cx="35" cy="40" r="2.5" fill="black" />
              <circle cx="65" cy="40" r="2.5" fill="black" />
            </>
          )}

          {state === 'happy' && (
            <>
              <path d="M 30 42 Q 35 32 40 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 60 42 Q 65 32 70 42" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="25" cy="48" r="4" fill="#FF4D4D" opacity="0.6" />
              <circle cx="75" cy="48" r="4" fill="#FF4D4D" opacity="0.6" />
            </>
          )}

          {state === 'sad' && (
            <>
              <path d="M 30 40 Q 35 45 40 40" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 60 40 Q 65 45 70 40" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 35 46 L 35 55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
              <path d="M 65 46 L 65 55" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {state === 'shocked' && (
            <>
              <circle cx="35" cy="38" r="8" fill="white" />
              <circle cx="65" cy="38" r="8" fill="white" />
              <circle cx="35" cy="38" r="2" fill="black" />
              <circle cx="65" cy="38" r="2" fill="black" />
              <circle cx="80" cy="25" r="3" fill="#93C5FD" opacity="0.8" />
            </>
          )}

          {state === 'mocking' && (
            <>
              <path d="M 28 40 L 42 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <path d="M 58 40 L 72 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <circle cx="40" cy="38" r="2" fill="black" />
              <circle cx="70" cy="38" r="2" fill="black" />
              <path d="M 28 32 L 40 33" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M 60 30 L 72 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {state === 'thinking' && (
            <>
              <path d="M 30 35 L 40 45 M 30 45 L 40 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <path d="M 60 35 L 70 45 M 60 45 L 70 35" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <motion.circle cx="35" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} />
              <motion.circle cx="50" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} />
              <motion.circle cx="65" cy="15" r="2" fill="white" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }} />
            </>
          )}
        </svg>
      </div>
    </motion.div>
  );
}
