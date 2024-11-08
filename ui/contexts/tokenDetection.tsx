import React, { ReactNode } from 'react';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';

export const TokenDetectionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  useTokenDetectionPolling();

  return <>{children}</>;
};
