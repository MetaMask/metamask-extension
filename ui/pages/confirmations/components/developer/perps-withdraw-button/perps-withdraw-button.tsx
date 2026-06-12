import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';

import { getSelectedInternalAccount } from '../../../../../../shared/lib/selectors/accounts';
import { createPerpsWithdrawTransaction } from '../../../../../components/app/perps/hooks/createPerpsWithdrawTransaction';
import { DeveloperButton } from '../developer-button';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../../hooks/useConfirmationNavigation';

export const PerpsWithdrawButton = () => {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = useCallback(async () => {
    if (!selectedAccount?.address) {
      console.error('No selected account');
      return;
    }

    setIsLoading(true);

    try {
      const { transactionId } = await createPerpsWithdrawTransaction({
        accountAddress: selectedAccount.address as Hex,
      });

      navigateToTransaction(transactionId, {
        loader: ConfirmationLoader.CustomAmount,
      });
    } catch (error) {
      console.error('Failed to create perps withdraw transaction', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigateToTransaction, selectedAccount?.address]);

  return (
    <DeveloperButton
      title="Perps Withdraw"
      onPress={handleTrigger}
      disabled={isLoading}
    />
  );
};
