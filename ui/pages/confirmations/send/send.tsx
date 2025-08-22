import React from 'react';

import { SendContextProvider } from '../context/send';
import { SendInner } from './send-inner';

export const Send = () => (
  <SendContextProvider>
    <SendInner />
  </SendContextProvider>
);
