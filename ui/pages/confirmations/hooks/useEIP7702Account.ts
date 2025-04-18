import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import { useConfirmationNavigation } from './useConfirmationNavigation';

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
        addTransactionAndRouteToConfirmationPage(
          {
            authorizationList: [
              {
                address: EIP_7702_REVOKE_ADDRESS,
              },
            ],
            from: address,
            to: address,
            type: TransactionEnvelopeType.setCode,
          },
          {
            networkClientId: globalNetworkClientId,
            type: TransactionType.revokeDelegation,
          },
        ),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch, globalNetworkClientId],
  );

  const upgradeAccount = useCallback(
    async (address: Hex, upgradeContractAddress: Hex) => {
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage(
          {
            authorizationList: [
              {
                address: upgradeContractAddress,
              },
            ],
            from: address,
            to: address,
            type: TransactionEnvelopeType.setCode,
          },
          {
            networkClientId: globalNetworkClientId,
            type: TransactionType.batch,
          },
        ),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch, globalNetworkClientId],
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

  return { isUpgraded, downgradeAccount, upgradeAccount };
}
