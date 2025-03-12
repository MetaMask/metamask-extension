import { useCallback, useEffect, useState } from 'react';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmationNavigation } from './useConfirmationNavigation';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import { Hex } from '@metamask/utils';

export const EIP_7702_REVOKE_ADDRESS =
  '0x0000000000000000000000000000000000000000';

export function useEIP7702Account({
  onRedirect,
}: { onRedirect?: () => void } = {}) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const globalNetworkClientId = useSelector(getSelectedNetworkClientId);

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  const downgradeAccount = useCallback(
    async (address: Hex) => {
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage({
          authorizationList: [
            {
              address: EIP_7702_REVOKE_ADDRESS,
            },
          ],
          from: address,
          to: address,
          type: TransactionEnvelopeType.setCode,
        }),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch],
  );

  const isUpgraded = useCallback(
    async (address: Hex) => {
      const code = await getCode(address, globalNetworkClientId);
      return code?.length > 2;
    },
    [globalNetworkClientId],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return { isUpgraded, downgradeAccount };
}
