"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageFrame({ children }: { children: ReactNode }) {
  return <motion.main id="main-content" className="page-frame" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, .36, 1] }}>{children}</motion.main>;
}
