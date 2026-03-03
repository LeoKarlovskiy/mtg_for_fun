import type { Variants } from 'framer-motion'

export const lifeDeltaVariants: Variants = {
  idle: { scale: 1 },
  increase: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  decrease: {
    scale: [1, 0.9, 1],
    transition: { duration: 0.2, ease: 'easeIn' }
  },
}

export const eliminationVariants: Variants = {
  alive: { opacity: 1, scale: 1 },
  eliminated: {
    opacity: [1, 1, 0.4],
    scale: [1, 1.05, 0.97],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
}

export const eliminationFlash: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.2, 1.4],
    transition: { duration: 0.5, ease: 'easeOut' }
  },
}

export const winOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' }
  },
}

export const winTitleVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
}

export const winGlowVariants: Variants = {
  dim: { boxShadow: '0 0 0px rgba(212,160,23,0)' },
  glow: {
    boxShadow: [
      '0 0 20px rgba(212,160,23,0.1)',
      '0 0 60px rgba(212,160,23,0.5)',
      '0 0 40px rgba(212,160,23,0.3)',
    ],
    transition: { duration: 2.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
  },
}

export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } },
}
