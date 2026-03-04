import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line import/no-extraneous-dependencies

const variants = {
  exit: (destinationPath: string) => {
    return destinationPath === '/'
      ? { opacity: 0, scale: 0.98 }
      : {};
  },
};

export const Animated = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      className="page-enter-animation h-full"
      variants={variants}
      exit="exit"
      transition={{ duration: 0.2, ease: [0.4, 0, 1, 1] }}
    >
      {children}
    </motion.div>
  );
};
