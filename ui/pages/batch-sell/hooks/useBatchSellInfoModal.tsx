import { useContext } from 'react';
import { BatchSellInfoModalContext } from '../providers/BatchSellInfoModalProvider';

export const useBatchSellnfoModal = () => useContext(BatchSellInfoModalContext);
