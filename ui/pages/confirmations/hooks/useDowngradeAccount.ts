import { useDispatch } from 'react-redux';
import { addTransactionAndRouteToConfirmationPage } from '../../../store/actions';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useConfirmationNavigation } from './useConfirmationNavigation';

export function useDowngradeAccount({
  onRedirect,
}: {
  onRedirect: () => void;
}) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const isDowngradePending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  const addDowngradeTransaction = useCallback(
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

  useEffect(() => {
    if (isDowngradePending) {
      navigateToId(transactionId);
      onRedirect();
    }
  }, [isDowngradePending, navigateToId, transactionId, onRedirect]);

  return { addDowngradeTransaction };
}
