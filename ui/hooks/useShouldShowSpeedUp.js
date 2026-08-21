import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SECOND } from '../../shared/constants/time';
import { getCurrentChainId } from '../../shared/lib/selectors/networks';

/**
 * Evaluates whether the transaction is eligible to be sped up, and registers
 * an effect to check the logic again after the transaction has surpassed 5 seconds
 * of queue time.
 *
 * @param {object} transactionGroup - the transaction group to check against
 * @param {boolean} isEarliestNonce - Whether this group is currently the earliest nonce
 */
export function useShouldShowSpeedUp(transactionGroup, isEarliestNonce) {
  const { transactions, hasRetried } = transactionGroup;
  const currentChainId = useSelector(getCurrentChainId);

  const [earliestTransaction = {}] = transactions;

  const matchCurrentChainId = earliestTransaction.chainId === currentChainId;

  const { submittedTime } = earliestTransaction;
  const [speedUpEnabled, setSpeedUpEnabled] = useState(() => {
    const timeDelta = Date.now() - submittedTime;
    const shouldEnable =
      timeDelta > 5000 && isEarliestNonce && !hasRetried && matchCurrentChainId;
    return shouldEnable;
  });
  const canSpeedUp = !hasRetried && isEarliestNonce && matchCurrentChainId;

  if (!canSpeedUp && speedUpEnabled) {
    setSpeedUpEnabled(false);
  } else if (canSpeedUp && !speedUpEnabled) {
    if (Date.now() - submittedTime > SECOND * 5) {
      setSpeedUpEnabled(true);
    }
  }

  useEffect(() => {
    // Schedule enabling speed-up once the transaction has been queued for 5s.
    // Immediate enable/disable based on current conditions is handled during render.
    if (!canSpeedUp || speedUpEnabled) {
      return undefined;
    }

    if (Date.now() - submittedTime > SECOND * 5) {
      return undefined;
    }

    const timeoutId = setTimeout(
      () => {
        setSpeedUpEnabled(true);
      },
      5001 - (Date.now() - submittedTime),
    );

    return () => {
      clearTimeout(timeoutId);
    };
  }, [submittedTime, speedUpEnabled, canSpeedUp]);

  return speedUpEnabled;
}
