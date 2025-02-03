import { useDispatch, useSelector } from 'react-redux';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  CONTRACT_ADDRESS_7702,
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useConfirmationNavigation } from './useConfirmationNavigation';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';

export function useEIP7702Account({ onRedirect }: { onRedirect: () => void }) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const globalNetworkClientId = useSelector(getSelectedNetworkClientId);

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  const setDelegation = useCallback(
    async (address: Hex) => {
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage(
          {
            authorizationList: [
              {
                address: CONTRACT_ADDRESS_7702,
              },
            ],
            from: address,
            to: address,
            type: TransactionEnvelopeType.setCode,
          },
          { type: TransactionType.setDelegation },
        ),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch],
  );

  const revokeDelegation = useCallback(
    async (address: Hex) => {
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage(
          {
            authorizationList: [
              {
                address: '0x0000000000000000000000000000000000000000',
              },
            ],
            from: address,
            to: address,
            type: TransactionEnvelopeType.setCode,
          },
          { type: TransactionType.revokeDelegation },
        ),
      )) as unknown as TransactionMeta;

      setTransactionId(transactionMeta?.id);
    },
    [dispatch],
  );

  const hasDelegation = useCallback(
    async (address: Hex) => {
      return (await getCode(address, globalNetworkClientId)) !== '0x';
    },
    [globalNetworkClientId],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return { hasDelegation, revokeDelegation, setDelegation };
}
