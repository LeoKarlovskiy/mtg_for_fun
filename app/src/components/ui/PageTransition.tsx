import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { pageVariants } from '../../animations/variants'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
