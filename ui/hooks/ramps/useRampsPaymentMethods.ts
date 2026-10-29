import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { type PaymentMethod } from '@metamask/ramps-controller';
import {
  selectPaymentMethods,
  selectProviders,
  selectTokens,
  selectUserRegion,
} from '../../selectors/rampsController';
import { setRampsSelectedPaymentMethod } from '../../store/controller-actions/ramps-controller';
import { rampsQueries } from './queries';
import { normalizeAssetIdForApi } from './utils/normalizeAssetIdForApi';
import { parseUserFacingError } from './utils/parseUserFacingError';

export type RampsQueryStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseRampsPaymentMethodsResult = {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (
    paymentMethod: PaymentMethod | null,
  ) => Promise<void>;
  isLoading: boolean;
  isFetching: boolean;
  status: RampsQueryStatus;
  isSuccess: boolean;
  error: string | null;
};

export function useRampsPaymentMethods(): UseRampsPaymentMethodsResult {
  const { selected: selectedPaymentMethod } = useSelector(selectPaymentMethods);
  const { selected: selectedProvider } = useSelector(selectProviders);
  const { selected: selectedToken } = useSelector(selectTokens);
  const userRegion = useSelector(selectUserRegion);

  const queryEnabled = Boolean(
    userRegion?.regionCode &&
    userRegion?.country?.currency &&
    selectedProvider?.id,
  );

  const paymentMethodsQuery = useQuery({
    ...rampsQueries.paymentMethods.options({
      regionCode: userRegion?.regionCode ?? '',
      fiat: userRegion?.country?.currency ?? '',
      assetId: normalizeAssetIdForApi(selectedToken?.assetId),
      providerId: selectedProvider?.id ?? '',
    }),
    enabled: queryEnabled,
  });

  const setSelectedPaymentMethod = useCallback(
    (paymentMethod: PaymentMethod | null) =>
      setRampsSelectedPaymentMethod(paymentMethod),
    [],
  );

  useEffect(() => {
    const methods = paymentMethodsQuery.data;
    if (methods === undefined) {
      return;
    }

    if (methods.length === 0) {
      if (selectedPaymentMethod !== null) {
        setSelectedPaymentMethod(null);
      }
      return;
    }

    let target: PaymentMethod | null = null;

    if (selectedPaymentMethod) {
      target =
        methods.find((method) => method.id === selectedPaymentMethod.id) ??
        null;
    }

    if (!target) {
      target = methods[0];
    }

    if (target.id !== selectedPaymentMethod?.id) {
      setSelectedPaymentMethod(target);
    }
  }, [
    paymentMethodsQuery.data,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
  ]);

  const isAutoSelecting = Boolean(
    paymentMethodsQuery.data?.length &&
    (!selectedPaymentMethod ||
      paymentMethodsQuery.data.every(
        (method) => method.id !== selectedPaymentMethod.id,
      )),
  );

  const status = useMemo<RampsQueryStatus>(() => {
    if (!queryEnabled) {
      return 'idle';
    }
    if (paymentMethodsQuery.isLoading) {
      return 'loading';
    }
    if (paymentMethodsQuery.isError) {
      return 'error';
    }
    return 'success';
  }, [
    paymentMethodsQuery.isError,
    paymentMethodsQuery.isLoading,
    queryEnabled,
  ]);

  return {
    paymentMethods: paymentMethodsQuery.data ?? [],
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    isLoading: status === 'loading' || isAutoSelecting,
    isFetching: paymentMethodsQuery.isFetching,
    status,
    isSuccess: status === 'success',
    error: paymentMethodsQuery.error
      ? parseUserFacingError(
          paymentMethodsQuery.error,
          'Failed to load payment methods',
        )
      : null,
  };
}

export default useRampsPaymentMethods;
