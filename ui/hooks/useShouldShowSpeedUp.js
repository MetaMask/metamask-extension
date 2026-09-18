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

  useEffect(() => {
    let timeoutId;

    if (
      (hasRetried || !isEarliestNonce || !matchCurrentChainId) &&
      speedUpEnabled
    ) {
      queueMicrotask(() => setSpeedUpEnabled(false));
    } else if (
      !hasRetried &&
      isEarliestNonce &&
      matchCurrentChainId &&
      !speedUpEnabled
    ) {
      if (Date.now() - submittedTime > SECOND * 5) {
        queueMicrotask(() => setSpeedUpEnabled(true));
      } else {
        timeoutId = setTimeout(
          () => {
            setSpeedUpEnabled(true);
          },
          5001 - (Date.now() - submittedTime),
        );
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    submittedTime,
    speedUpEnabled,
    hasRetried,
    isEarliestNonce,
    matchCurrentChainId,
  ]);

  return speedUpEnabled;
}
