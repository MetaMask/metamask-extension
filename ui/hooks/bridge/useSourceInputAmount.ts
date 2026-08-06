import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FeatureId,
  getSwapType,
  UnifiedSwapBridgeEventName,
  type InputPrimaryDenomination,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import {
  convertFiatToTokenAmount,
  convertTokenAmountToFiat,
  sanitizeAmountInput,
} from '../../pages/bridge/utils/quote';
import { getInputPrimaryDenomination } from '../../ducks/bridge/selectors';
import {
  setInputPrimaryDenomination,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { useDispatch } from '../../store/hooks';
import type { BridgeToken } from '../../ducks/bridge/types';

type UseSourceInputAmountParams = {
  enabled: boolean;
  sourceAmount: string | null;
  conversionRate: number | null | undefined;
  sourceToken?: BridgeToken | null;
  destinationToken?: BridgeToken | null;
  onSourceAmountChange: (value: string | null) => void;
};

type UseSourceInputAmountResult = {
  amount: string | undefined;
  tokenAmount: string | null;
  selectedDenomination: InputPrimaryDenomination;
  isFiatPrimary: boolean;
  canToggle: boolean;
  handleAmountChange: (value: string) => void;
  togglePrimaryDenomination: () => void;
};

const amountsAreEqual = (
  firstAmount: string | null | undefined,
  secondAmount: string | null | undefined,
) =>
  !firstAmount || !secondAmount
    ? firstAmount === secondAmount
    : new BigNumber(firstAmount).eq(secondAmount);

// Keeps the token amount canonical while exposing a fiat source input.
export const useSourceInputAmount = ({
  enabled,
  sourceAmount,
  conversionRate,
  sourceToken,
  destinationToken,
  onSourceAmountChange,
}: UseSourceInputAmountParams): UseSourceInputAmountResult => {
  const dispatch = useDispatch();
  // The controller value persists the preference, while local state updates the
  // UI immediately. The ref marks the latest pending controller update so an
  // older async state refresh cannot overwrite a newer toggle.
  const persistedDenomination = useSelector(getInputPrimaryDenomination);
  const selectedDenominationRef = useRef<InputPrimaryDenomination>();
  const [lastEdited, setLastEdited] =
    useState<[string | null, number | null | undefined]>();
  const [selectedDenomination, setSelectedDenomination] =
    useState<InputPrimaryDenomination>(persistedDenomination);
  const [fiatAmount, setFiatAmount] = useState<string | undefined>(() =>
    convertTokenAmountToFiat(sourceAmount, conversionRate),
  );

  useEffect(() => {
    if (selectedDenominationRef.current === persistedDenomination) {
      selectedDenominationRef.current = undefined;
    } else if (!selectedDenominationRef.current) {
      setSelectedDenomination(persistedDenomination);
    }
  }, [persistedDenomination]);

  const canToggle = Boolean(
    enabled &&
    sourceToken &&
    sourceToken.decimals !== undefined &&
    conversionRate &&
    conversionRate > 0,
  );
  const isFiatPrimary = canToggle && selectedDenomination === 'fiat_value';

  const displayedFiatAmount =
    isFiatPrimary &&
    amountsAreEqual(lastEdited?.[0], sourceAmount) &&
    lastEdited?.[1] === conversionRate
      ? fiatAmount
      : convertTokenAmountToFiat(sourceAmount, conversionRate);

  const handleAmountChange = useCallback(
    (value: string) => {
      if (!isFiatPrimary) {
        setLastEdited(undefined);
        onSourceAmountChange(value || null);
        return;
      }

      const sanitizedValue = sanitizeAmountInput(value);
      const decimalIndex = sanitizedValue.indexOf('.');
      const nextFiatAmount = sanitizedValue.slice(
        0,
        decimalIndex === -1 ? undefined : decimalIndex + 3,
      );

      setFiatAmount(nextFiatAmount || undefined);
      if (!nextFiatAmount || nextFiatAmount === '.') {
        setLastEdited(undefined);
        onSourceAmountChange(null);
        return;
      }

      const nextTokenAmount = convertFiatToTokenAmount(
        nextFiatAmount,
        conversionRate,
        sourceToken?.decimals,
      );
      setLastEdited([nextTokenAmount ?? null, conversionRate]);
      onSourceAmountChange(nextTokenAmount ?? null);
    },
    [
      conversionRate,
      isFiatPrimary,
      onSourceAmountChange,
      sourceToken?.decimals,
    ],
  );

  const togglePrimaryDenomination = useCallback(() => {
    if (!canToggle || !sourceToken) {
      return;
    }

    const nextDenomination: InputPrimaryDenomination =
      selectedDenomination === 'fiat_value' ? 'token_amount' : 'fiat_value';

    selectedDenominationRef.current = nextDenomination;
    setSelectedDenomination(nextDenomination);
    if (nextDenomination === 'fiat_value') {
      setFiatAmount(convertTokenAmountToFiat(sourceAmount, conversionRate));
    }
    setLastEdited(undefined);

    dispatch(setInputPrimaryDenomination(nextDenomination));
    // Analytics property names are defined by the Segment schema.
    /* eslint-disable @typescript-eslint/naming-convention */
    const toggleProperties = {
      token_symbol_source: sourceToken.symbol,
      token_symbol_destination: destinationToken?.symbol ?? null,
      previous_primary_denomination: selectedDenomination,
      new_primary_denomination: nextDenomination,
      chain_id_source: sourceToken.chainId,
      chain_id_destination: destinationToken?.chainId ?? null,
      token_address_source: sourceToken.assetId,
      token_address_destination: destinationToken?.assetId ?? null,
      swap_type: getSwapType(sourceToken.chainId, destinationToken?.chainId),
      feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    dispatch(
      trackUnifiedSwapBridgeEvent(
        UnifiedSwapBridgeEventName.FiatCryptoToggleClicked,
        toggleProperties,
      ),
    );
  }, [
    canToggle,
    conversionRate,
    destinationToken,
    dispatch,
    selectedDenomination,
    sourceAmount,
    sourceToken,
  ]);

  return {
    amount: isFiatPrimary ? displayedFiatAmount : (sourceAmount ?? undefined),
    tokenAmount: sourceAmount,
    selectedDenomination,
    isFiatPrimary,
    canToggle,
    handleAmountChange,
    togglePrimaryDenomination,
  };
};
