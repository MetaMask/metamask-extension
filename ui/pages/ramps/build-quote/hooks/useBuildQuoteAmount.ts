import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useRampsBuildQuoteDraft } from '../../context/ramps-flow-context';
import { parseFiatAmount } from '../utils/build-quote';

const DEFAULT_AMOUNT = '100';
const QUOTE_DEBOUNCE_MS = 500;
const FIAT_AMOUNT_INPUT_PATTERN = /^[0-9]*[.,]?[0-9]*$/u;

export function useBuildQuoteAmount(regionDefaultAmount?: number) {
  const { draftAmount, setDraftAmount } = useRampsBuildQuoteDraft();
  const [amount, setAmount] = useState(draftAmount ?? DEFAULT_AMOUNT);
  const [userHasEnteredAmount, setUserHasEnteredAmount] = useState(
    draftAmount !== undefined,
  );
  const amountAsNumber = useMemo(() => parseFiatAmount(amount), [amount]);
  const debouncedAmount = useDebouncedValue(amountAsNumber, QUOTE_DEBOUNCE_MS);

  useEffect(() => {
    if (!userHasEnteredAmount && regionDefaultAmount !== undefined) {
      setAmount(String(regionDefaultAmount));
      setUserHasEnteredAmount(true);
    }
  }, [regionDefaultAmount, userHasEnteredAmount]);

  // Persist the draft on the flow so the amount survives the build-quote screen
  // unmounting while the user picks a payment method or provider. Only persist
  // once the amount is settled (user-entered or region default) so the built-in
  // default does not suppress the region default on a later mount.
  useEffect(() => {
    if (userHasEnteredAmount) {
      setDraftAmount(amount);
    }
  }, [amount, userHasEnteredAmount, setDraftAmount]);

  const handleAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (FIAT_AMOUNT_INPUT_PATTERN.test(value)) {
        setAmount(value);
        setUserHasEnteredAmount(true);
      }
    },
    [],
  );

  return {
    amount,
    amountAsNumber,
    debouncedAmount,
    handleAmountChange,
  };
}
