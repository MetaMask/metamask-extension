import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';
import { getUseExternalServices } from '../../selectors';
import { useMessenger } from '../useMessenger';
import { activityQueryKey } from './useCachedEvmTransaction';

const capabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: ['TransactionController:transactionStatusUpdated'],
});

type ActivityCacheInvalidationMessenger = RouteMessengerFromCapabilities<
  typeof capabilities
>;

export function useActivityCacheInvalidation() {
  const queryClient = useQueryClient();
  const messenger = useMessenger<ActivityCacheInvalidationMessenger>();
  const useExternalServices = useSelector(getUseExternalServices);
  const useExternalServicesRef = useRef(useExternalServices);
  useExternalServicesRef.current = useExternalServices;
  const firedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleStatusUpdated = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      if (!useExternalServicesRef.current) {
        return;
      }

      const payload = Array.isArray(raw) ? raw[0] : raw;
      const { transactionMeta } = payload;

      if (!transactionMeta?.chainId?.startsWith('0x')) {
        return;
      }

      if (transactionMeta.status !== TransactionStatus.confirmed) {
        return;
      }

      const { id } = transactionMeta;
      if (firedIdsRef.current.has(id)) {
        return;
      }

      firedIdsRef.current.add(id);
      queryClient.invalidateQueries({ queryKey: activityQueryKey });
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleStatusUpdated,
    );

    return () => {
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleStatusUpdated,
      );
    };
  }, [messenger, queryClient]);
}
