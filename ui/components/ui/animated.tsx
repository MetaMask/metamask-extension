import React from 'react';

export const Animated = ({ children }: { children: React.ReactNode }) => {
  return <div className="page-enter-animation h-full">{children}</div>;
};
