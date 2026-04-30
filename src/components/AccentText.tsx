"use client";

import { motion } from "framer-motion";

interface AccentTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function AccentText({ children, className = "", delay = 0 }: AccentTextProps) {
  return (
    <motion.span
      className={`text-accent font-bold ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}
