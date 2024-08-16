import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  getKnownMethodData,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import { getContractMethodData } from '../../../../../../store/actions';

export const useKnownMethodDataInTransaction = (
  currentConfirmation: TransactionMeta,
) => {
  const dispatch = useDispatch();
  const use4ByteResolution = useSelector(use4ByteResolutionSelector);
  const transactionData = currentConfirmation?.txParams?.data;
  if (use4ByteResolution && transactionData) {
    dispatch(getContractMethodData(currentConfirmation.txParams.data));
  }
  const knownMethodData =
    useSelector((state) => getKnownMethodData(state, transactionData)) || {};
  return { knownMethodData };
};
