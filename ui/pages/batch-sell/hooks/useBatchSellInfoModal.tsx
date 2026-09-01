import { useContext } from 'react';
import { BatchSellInfoModalContext } from '../providers/batch-sell-info-modal-provider';

export const useBatchSellInfoModal = () =>
  useContext(BatchSellInfoModalContext);
