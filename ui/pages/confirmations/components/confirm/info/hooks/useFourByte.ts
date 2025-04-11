import type { Hex } from '@metamask/utils';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { hasTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import {
  getKnownMethodData,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import { getContractMethodData } from '../../../../../../store/actions';

export const useFourByte = ({ to, data }: { to?: Hex; data?: Hex }) => {
  const dispatch = useDispatch();
  const isFourByteEnabled = useSelector(use4ByteResolutionSelector);
  const transactionTo = to;
  const transactionData = data;

  useEffect(() => {
    if (
      !isFourByteEnabled ||
      !hasTransactionData(transactionData) ||
      !transactionTo
    ) {
      return;
    }

    dispatch(getContractMethodData(transactionData));
  }, [isFourByteEnabled, transactionData, transactionTo, dispatch]);

  const methodData = useSelector((state) =>
    getKnownMethodData(state, transactionData),
  );

  if (!transactionTo) {
    return null;
  }

  return methodData;
};
