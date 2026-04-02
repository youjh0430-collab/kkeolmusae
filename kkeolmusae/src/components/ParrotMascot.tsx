"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MascotVariant = 'full' | 'face' | 'avatar';

export default function ParrotMascot({ 
  className = "", 
  emotion = 'default',
  variant = 'avatar'
}: { 
  className?: string, 
  emotion?: 'default' | 'sad' | 'excited' | 'mocking',
  variant?: MascotVariant
}) {
  
  // Mapping existing emotions to the new SVG states
  let state: 'idle' | 'happy' | 'sad' | 'thinking' = 'idle';
  if (emotion === 'sad') state = 'sad';
  if (emotion === 'excited' || emotion === 'mocking') state = 'happy';

  return (
    <motion.div 
      className={cn("relative mx-auto", className, variant === 'avatar' ? 'w-32 h-32' : 'w-48 h-48')}
      animate={state === 'thinking' ? { y: [-5, 5, -5] } : { y: [0, -10, 0] }}
      transition={{ duration: state === 'thinking' ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg scale-110">
          <motion.circle 
            cx="50" cy="50" r="45" 
            fill="#FF6B35" 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
          <circle cx="35" cy="40" r="5" fill="white" />
          <circle cx="65" cy="40" r="5" fill="white" />
          <motion.circle 
            cx="35" cy="40" r="2.5" fill="black" 
            animate={state === 'happy' ? { scale: [1, 1.5, 1] } : {}}
          />
          <motion.circle 
            cx="65" cy="40" r="2.5" fill="black" 
            animate={state === 'happy' ? { scale: [1, 1.5, 1] } : {}}
          />
          <path d="M45 55 L55 55 L50 75 Z" fill="#FFB347" />
          {state === 'sad' && (
            <path d="M35 30 Q50 20 65 30" stroke="white" strokeWidth="2" fill="none" />
          )}
          {state === 'thinking' && (
            <motion.circle 
              cx="80" cy="20" r="10" fill="white" opacity="0.8"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity }}
            />
          )}
        </svg>
      </div>
    </motion.div>
  );
}
