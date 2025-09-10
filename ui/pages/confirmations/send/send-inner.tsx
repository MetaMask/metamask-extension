import React from 'react';

import { AmountRecipient } from '../components/send/amount-recipient';
import { Asset } from '../components/send/asset';
import { Loader } from '../components/send/loader';
import { SendPages } from '../constants/send';
import { useSendContext } from '../context/send';
import { useSendQueryParams } from '../hooks/send/useSendQueryParams';
import { useRedesignedSendFlow } from '../hooks/useRedesignedSendFlow';

export const SendInner = () => {
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();
  useSendQueryParams();
  const { currentPage } = useSendContext();

  console.log('OGP - isSendRedesignEnabled: ', isSendRedesignEnabled);

  if (currentPage === SendPages.LOADER) {
    return <Loader />;
  }
  if (currentPage === SendPages.ASSET) {
    return <Asset />;
  }
  if (currentPage === SendPages.AMOUNTRECIPIENT) {
    return <AmountRecipient />;
  }

  return null;
};
