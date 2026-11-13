/* eslint-disable @typescript-eslint/naming-convention -- property keys match the shared Mobile event schema */
import { useEffect, useRef } from 'react';
import type { Json } from '@metamask/utils';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  NetworkEditedField,
  NetworkManagementAction,
  NetworkManagementEntryPoint,
  NetworkManagementInteractionType,
  NetworkManagementSource,
  NetworkRemovalType,
} from '../../../shared/constants/metametrics';
import { getNetworkSectionKey } from './network-sections';

type AnalyticsFns = Pick<
  ReturnType<typeof useAnalytics>,
  'trackEvent' | 'createEventBuilder'
>;

export type ComparableNetwork = {
  name?: string;
  chainId?: string;
  nativeCurrency?: string;
  rpcEndpoints?: { url: string }[];
  defaultRpcEndpointIndex?: number;
  blockExplorerUrls?: string[];
};

const definedProperties = (
  properties: Record<string, Json | undefined>,
): Record<string, Json> =>
  Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as Record<string, Json>;

const trackNetworkEvent = (
  { trackEvent, createEventBuilder }: AnalyticsFns,
  event: MetaMetricsEventName,
  properties: Record<string, Json | undefined>,
) => {
  // Analytics must not block the network flow when tracking fails.
  Promise.resolve(
    trackEvent(
      createEventBuilder(event)
        .addCategory(MetaMetricsEventCategory.Network)
        .addProperties(definedProperties(properties))
        .build(),
    ),
  ).catch(() => undefined);
};

export const getChangedNetworkFields = (
  existing: ComparableNetwork,
  next: ComparableNetwork,
): NetworkEditedField[] => {
  const fields: NetworkEditedField[] = [];

  if ((existing.name ?? '') !== (next.name ?? '')) {
    fields.push(NetworkEditedField.Name);
  }

  if ((existing.nativeCurrency ?? '') !== (next.nativeCurrency ?? '')) {
    fields.push(NetworkEditedField.NativeSymbol);
  }

  if ((existing.chainId ?? '') !== (next.chainId ?? '')) {
    fields.push(NetworkEditedField.ChainId);
  }

  const existingRpcUrls = (existing.rpcEndpoints ?? [])
    .map((endpoint) => endpoint.url)
    .join('|');
  const nextRpcUrls = (next.rpcEndpoints ?? [])
    .map((endpoint) => endpoint.url)
    .join('|');
  if (
    existingRpcUrls !== nextRpcUrls ||
    (existing.defaultRpcEndpointIndex ?? 0) !==
      (next.defaultRpcEndpointIndex ?? 0)
  ) {
    fields.push(NetworkEditedField.Rpc);
  }

  const existingExplorers = (existing.blockExplorerUrls ?? []).join('|');
  const nextExplorers = (next.blockExplorerUrls ?? []).join('|');
  if (existingExplorers !== nextExplorers) {
    fields.push(NetworkEditedField.Explorer);
  }

  return fields;
};

export const trackNetworkManagementInteracted = (
  analytics: AnalyticsFns,
  {
    interactionType,
    action,
    entryPoint,
    chainId,
    networkType,
    rpcCount,
  }: {
    interactionType: NetworkManagementInteractionType;
    action?: NetworkManagementAction;
    entryPoint: NetworkManagementEntryPoint;
    chainId?: string;
    networkType?: string;
    rpcCount?: number;
  },
) => {
  trackNetworkEvent(
    analytics,
    MetaMetricsEventName.NetworkManagementInteracted,
    {
      interaction_type: interactionType,
      action,
      entry_point: entryPoint,
      chain_id: chainId,
      network_type: networkType,
      rpc_count: rpcCount,
    },
  );
};

export const trackNetworkAdded = (
  analytics: AnalyticsFns,
  {
    chainId,
    source,
    entryPoint,
    rpcCount,
    blockExplorerSet,
  }: {
    chainId: string;
    source: NetworkManagementSource;
    entryPoint: NetworkManagementEntryPoint;
    rpcCount: number;
    blockExplorerSet: boolean;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.NetworkAdded, {
    chain_id: chainId,
    network_type: getNetworkSectionKey(chainId),
    source,
    entry_point: entryPoint,
    rpc_count: rpcCount,
    block_explorer_set: blockExplorerSet,
  });
};

export const trackNetworkEdited = (
  analytics: AnalyticsFns,
  {
    chainId,
    entryPoint,
    changedFields,
    rpcCount,
  }: {
    chainId: string;
    entryPoint: NetworkManagementEntryPoint;
    changedFields: NetworkEditedField[];
    rpcCount: number;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.NetworkEdited, {
    chain_id: chainId,
    network_type: getNetworkSectionKey(chainId),
    entry_point: entryPoint,
    changed_fields: changedFields,
    rpc_count: rpcCount,
  });
};

export const trackNetworkRemoved = (
  analytics: AnalyticsFns,
  {
    chainId,
    entryPoint,
    removalType,
  }: {
    chainId: string;
    entryPoint: NetworkManagementEntryPoint;
    removalType: NetworkRemovalType;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.NetworkRemoved, {
    chain_id: chainId,
    network_type: getNetworkSectionKey(chainId),
    entry_point: entryPoint,
    removal_type: removalType,
  });
};

export const trackRpcAdded = (
  analytics: AnalyticsFns,
  {
    chainId,
    rpcCount,
    source,
    entryPoint,
  }: {
    chainId?: string;
    rpcCount: number;
    source: NetworkManagementSource;
    entryPoint: NetworkManagementEntryPoint;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.RpcAdded, {
    chain_id: chainId,
    rpc_count: rpcCount,
    source,
    entry_point: entryPoint,
  });
};

export const trackRpcSwitched = (
  analytics: AnalyticsFns,
  {
    chainId,
    rpcUrlIndex,
    rpcCount,
    entryPoint,
  }: {
    chainId: string;
    rpcUrlIndex: number;
    rpcCount: number;
    entryPoint: NetworkManagementEntryPoint;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.RpcSwitched, {
    chain_id: chainId,
    rpc_url_index: rpcUrlIndex,
    rpc_count: rpcCount,
    entry_point: entryPoint,
  });
};

export const trackRpcRemoved = (
  analytics: AnalyticsFns,
  {
    chainId,
    rpcCount,
    wasActive,
    entryPoint,
  }: {
    chainId?: string;
    rpcCount: number;
    wasActive: boolean;
    entryPoint: NetworkManagementEntryPoint;
  },
) => {
  trackNetworkEvent(analytics, MetaMetricsEventName.RpcRemoved, {
    chain_id: chainId,
    rpc_count: rpcCount,
    was_active: wasActive,
    entry_point: entryPoint,
  });
};

export const trackDappNetworkRequest = (
  analytics: AnalyticsFns,
  event:
    | MetaMetricsEventName.NetworkRequested
    | MetaMetricsEventName.NetworkRequestRejected,
  {
    chainId,
    dappHostName,
    alreadyAdded,
    sourceConnectionMethod,
  }: {
    chainId: string;
    dappHostName: string;
    alreadyAdded: boolean;
    sourceConnectionMethod: string;
  },
) => {
  trackNetworkEvent(analytics, event, {
    chain_id: chainId,
    dapp_host_name: dappHostName,
    already_added: alreadyAdded,
    source_connection_method: sourceConnectionMethod,
  });
};

export type NetworkManagementStep =
  | 'rpc-form-add'
  | 'rpc-form-edit'
  | 'rpc-selector'
  | null;

const NETWORK_MANAGEMENT_STEPS: Record<string, NetworkManagementStep> = {
  'add-rpc': 'rpc-form-add',
  'edit-rpc': 'rpc-form-edit',
  'select-rpc': 'rpc-selector',
};

export const getNetworkManagementStep = (view: string): NetworkManagementStep =>
  NETWORK_MANAGEMENT_STEPS[view] ?? null;

/**
 * Fires the pre-outcome step once each time `step` becomes a tracked screen.
 */
export const useTrackNetworkManagementStep = ({
  step,
  entryPoint,
  chainId,
  rpcCount,
  networkType,
}: {
  step: NetworkManagementStep;
  entryPoint: NetworkManagementEntryPoint;
  chainId?: string;
  rpcCount?: number;
  networkType?: string;
}) => {
  const analytics = useAnalytics();
  const trackedStepRef = useRef<NetworkManagementStep>(null);

  useEffect(() => {
    if (!step) {
      trackedStepRef.current = null;
      return;
    }

    if (trackedStepRef.current === step) {
      return;
    }

    trackedStepRef.current = step;

    if (step === 'rpc-selector') {
      trackNetworkManagementInteracted(analytics, {
        interactionType: NetworkManagementInteractionType.RpcSelectorOpened,
        entryPoint,
        chainId,
        rpcCount,
      });
      return;
    }

    trackNetworkManagementInteracted(analytics, {
      interactionType: NetworkManagementInteractionType.RpcFormOpened,
      action:
        step === 'rpc-form-edit'
          ? NetworkManagementAction.Edit
          : NetworkManagementAction.Add,
      entryPoint,
      chainId,
      rpcCount,
      networkType,
    });
  }, [analytics, chainId, entryPoint, networkType, rpcCount, step]);
};
