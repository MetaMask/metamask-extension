import React from 'react';

import { Amount } from '../components/send/amount';
import { Asset } from '../components/send/asset';
import { Loader } from '../components/send/loader';
import { SendPages } from '../constants/send';
import { Recipient } from '../components/send/recipient';
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
  if (currentPage === SendPages.AMOUNT) {
    return <Amount />;
  }
  if (currentPage === SendPages.RECIPIENT) {
    return <Recipient />;
  }

  return null;
};
