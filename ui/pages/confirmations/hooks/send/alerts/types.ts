import type { ReactNode } from 'react';

export type SendAlert = {
  key: string;
  title: string;
  message: ReactNode;
  acknowledgeButtonLabel?: string;
};
