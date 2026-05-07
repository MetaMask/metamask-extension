import { useContext } from 'react';
import { BatchSellModalContext } from '../providers/BatchSellModalProvider';

export const useBatchSellModal = () => useContext(BatchSellModalContext);
