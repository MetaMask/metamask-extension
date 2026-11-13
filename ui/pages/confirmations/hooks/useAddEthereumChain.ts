import { useCallback } from 'react';
import { ApprovalType, toHex } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useConfirmContext } from '../context/confirm';
import { resolvePendingApproval } from '../../../store/actions';
import type { AddEthereumChainContext } from '../external/add-ethereum-chain/types';
import { useDispatch } from '../../../store/hooks';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import {
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
  NetworkManagementEntryPoint,
  NetworkManagementSource,
} from '../../../../shared/constants/metametrics';
import {
  trackDappNetworkRequest,
  trackNetworkAdded,
} from '../../../helpers/utils/network-management-metrics';

const getDappHostName = (origin?: string) => {
  if (!origin) {
    return '';
  }

  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//u, '');
  }
};

// Ported from templates/add-ethereum-chain.js
export const useAddEthereumChain = () => {
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const { id, origin, requestData } = currentConfirmation ?? {};
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const chainId = requestData?.chainId ? toHex(requestData.chainId) : undefined;
  const alreadyAdded = Boolean(chainId && networkConfigurations[chainId]);

  const onSubmit = useCallback(async () => {
    await dispatch(resolvePendingApproval(id, requestData));

    // An approval for a chain that is already configured is an update.
    // Network Added is only the new-network outcome.
    if (chainId && !alreadyAdded) {
      trackNetworkAdded(
        { trackEvent, createEventBuilder },
        {
          chainId,
          source: NetworkManagementSource.Dapp,
          entryPoint: NetworkManagementEntryPoint.DappRequest,
          rpcCount: requestData?.rpcUrl ? 1 : 0,
          blockExplorerSet: Boolean(requestData?.rpcPrefs?.blockExplorerUrl),
        },
      );
    }
  }, [
    alreadyAdded,
    chainId,
    createEventBuilder,
    dispatch,
    id,
    requestData,
    trackEvent,
  ]);

  const onReject = useCallback(() => {
    if (!chainId) {
      return;
    }

    trackDappNetworkRequest(
      { trackEvent, createEventBuilder },
      MetaMetricsEventName.NetworkRequestRejected,
      {
        chainId,
        dappHostName: getDappHostName(origin),
        alreadyAdded,
        sourceConnectionMethod: MetaMetricsNetworkEventSource.Dapp,
      },
    );
  }, [alreadyAdded, chainId, createEventBuilder, origin, trackEvent]);

  return {
    onSubmit,
    onReject,
  };
};

export function isAddEthereumChainType(
  confirmation: TransactionMeta | AddEthereumChainContext | null,
): confirmation is AddEthereumChainContext {
  return confirmation?.type === ApprovalType.AddEthereumChain;
}
