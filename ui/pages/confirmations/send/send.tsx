import React from 'react';

import { SendContextProvider } from '../context/send';
import { SendMetricsContextProvider } from '../context/send-metrics';
import { SendInner } from './send-inner';

export const Send = () => (
  <SendContextProvider>
    <SendMetricsContextProvider>
      <SendInner />
    </SendMetricsContextProvider>
  </SendContextProvider>
);
