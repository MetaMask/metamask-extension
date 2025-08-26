import React from 'react';

import { AmountRecipient } from '../components/send/amount-recipient';
import { Asset } from '../components/send/asset';
import { Loader } from '../components/send/loader';
import { SendPages } from '../constants/send';
import { useSendContext } from '../context/send';
import { useSendQueryParams } from '../hooks/send/useSendQueryParams';

export const SendInner = () => {
  useSendQueryParams();
  const { currentPage } = useSendContext();

  if (currentPage === SendPages.LOADER) {
    return <Loader />;
  }
  if (currentPage === SendPages.ASSET) {
    return <Asset />;
  }
  if (currentPage === SendPages.AMOUNT_RECIPIENT) {
    return <AmountRecipient />;
  }

  return null;
};
