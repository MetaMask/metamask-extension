import { useContext } from 'react';
import { BatchSellInfoModalContext } from '../providers/BatchSellInfoModalProvider';

export const useBatchSellInfoModal = () =>
  useContext(BatchSellInfoModalContext);
