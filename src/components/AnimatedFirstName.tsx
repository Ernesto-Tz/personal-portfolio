"use client";

import { motion } from "framer-motion";

interface AnimatedFirstNameProps {
  firstName: string;
  delay?: number;
}

export function AnimatedFirstName({ firstName, delay = 0.3 }: AnimatedFirstNameProps) {
  return (
    <motion.span
      className="font-bold inline-block"
      style={{ color: "#FF8303" }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {firstName}
    </motion.span>
  );
}
