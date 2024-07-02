import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {
  getKnownMethodData,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import { getContractMethodData } from '../../../../../../store/actions';

export const useFourByte = (currentConfirmation: TransactionMeta) => {
  const dispatch = useDispatch();
  const isFourByteEnabled = useSelector(use4ByteResolutionSelector);
  const transactionData = currentConfirmation?.txParams?.data;

  useEffect(() => {
    if (!isFourByteEnabled || !transactionData) {
      return;
    }

    dispatch(getContractMethodData(transactionData));
  }, [isFourByteEnabled, transactionData, dispatch]);

  const methodData = useSelector((state) =>
    getKnownMethodData(state, transactionData),
  );

  return methodData;
};
