import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { parseFiatAmount } from '../utils/build-quote';

const DEFAULT_AMOUNT = '100';
const QUOTE_DEBOUNCE_MS = 500;
const FIAT_AMOUNT_INPUT_PATTERN = /^[0-9]*[.,]?[0-9]*$/u;

export function useBuildQuoteAmount(regionDefaultAmount?: number) {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [userHasEnteredAmount, setUserHasEnteredAmount] = useState(false);
  const amountAsNumber = useMemo(() => parseFiatAmount(amount), [amount]);
  const debouncedAmount = useDebouncedValue(amountAsNumber, QUOTE_DEBOUNCE_MS);

  useEffect(() => {
    if (!userHasEnteredAmount && regionDefaultAmount !== undefined) {
      setAmount(String(regionDefaultAmount));
      setUserHasEnteredAmount(true);
    }
  }, [regionDefaultAmount, userHasEnteredAmount]);

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
