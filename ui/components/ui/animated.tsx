import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line import/no-extraneous-dependencies

export const Animated = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      className="page-enter-animation h-full"
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 1, 1] }}
    >
      {children}
    </motion.div>
  );
};
