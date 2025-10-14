import React from 'react';

import { SendPage } from '../../../components/multichain/pages/send';
import { SendContextProvider } from '../context/send';
import { SendMetricsContextProvider } from '../context/send-metrics';
import { useRedesignedSendFlow } from '../hooks/useRedesignedSendFlow';
import { SendInner } from './send-inner';

export const Send = () => {
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();

  if (isSendRedesignEnabled) {
    return (
      <SendContextProvider>
        <SendMetricsContextProvider>
          <SendInner />
        </SendMetricsContextProvider>
      </SendContextProvider>
    );
  }

  return <SendPage />;
};
