import { TransactionMeta } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  getKnownMethodData,
  use4ByteResolutionSelector,
} from '../../../../selectors';
import { getContractMethodData } from '../../../../store/actions';

export const useKnownMethodDataInTransaction = (
  currentConfirmation: TransactionMeta,
) => {
  const dispatch = useDispatch();

  const use4ByteResolution = useSelector(use4ByteResolutionSelector);
  if (use4ByteResolution && currentConfirmation?.txParams?.data) {
    dispatch(getContractMethodData(currentConfirmation.txParams.data));
  }

  const knownMethodData =
    useSelector((state) =>
      getKnownMethodData(state, currentConfirmation?.txParams?.data),
    ) || {};

  return { knownMethodData };
};
