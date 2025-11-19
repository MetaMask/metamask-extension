import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';

import { useConfirmContext } from '../../../context/confirm';

const DAPP_SWAP_COMPARISON_ORIGIN = 'https://app.uniswap.org';
const TEST_DAPP_ORIGIN = 'https://metamask.github.io';

export function useSwapCheck() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { origin, type } = currentConfirmation ?? {
    txParams: { data: '' },
  };

  const isSwapToBeCompared = useMemo(() => {
    return (
      (origin === DAPP_SWAP_COMPARISON_ORIGIN || origin === TEST_DAPP_ORIGIN) &&
      type === TransactionType.contractInteraction
    );
  }, [origin, type]);

  return {
    isSwapToBeCompared,
  };
}
