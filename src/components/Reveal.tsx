"use client";

import { motion } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  translateY?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, translateY = 16, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: translateY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
