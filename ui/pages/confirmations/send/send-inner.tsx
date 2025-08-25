import React from 'react';

import { Amount } from '../components/send/amount';
import { Asset } from '../components/send/asset';
import { SendPages } from '../constants/send';
import { SendTo } from '../components/send/send-to';
import { useSendContext } from '../context/send';

export const SendInner = () => {
  const { currentPage } = useSendContext();
  if (currentPage === SendPages.ASSET) {
    return <Asset />;
  }
  if (currentPage === SendPages.AMOUNT) {
    return <Amount />;
  }
  return <SendTo />;
};
