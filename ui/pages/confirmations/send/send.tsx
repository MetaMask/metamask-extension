import React from 'react';

import { SendContextProvider } from '../context/send';
import { SendInner } from './send-inner';
import { SendMetricsContextProvider } from '../context/send-metrics';

export const Send = () => (
  <SendContextProvider>
    <SendMetricsContextProvider>
      <SendInner />
    </SendMetricsContextProvider>
  </SendContextProvider>
);
