"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function AnimatedUnderlineTextOne({
  children,
  className,
  ...props
}) {
  return (
    <motion.div
      className={cn("relative inline-block", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
      <motion.div
        className="absolute -bottom-1 left-0 h-0.5 bg-white"
        initial={{ width: 0 }}
        whileInView={{ width: "100%" }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      />
    </motion.div>
  );
} 