import {
  SimulationData,
  SimulationErrorCode,
} from '@metamask/transaction-controller';
import { useContext, useEffect, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import { useTransactionEventFragment } from '../../hooks/useTransactionEventFragment';
import {
  UseDisplayNameRequest,
  UseDisplayNameResponse,
  useDisplayNames,
} from '../../../../hooks/useDisplayName';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { getCurrentChainId } from '../../../../selectors';
import { calculateTotalFiat } from './fiat-display';
import { BalanceChange } from './types';
import { useLoadingTime } from './useLoadingTime';

export type UseSimulationMetricsProps = {
  balanceChanges: BalanceChange[];
  loading: boolean;
  simulationData?: SimulationData;
  transactionId: string;
  enableMetrics: boolean;
};

export enum SimulationResponseType {
  Failed = 'failed',
  Reverted = 'transaction_revert',
  NoChanges = 'no_balance_change',
  Changes = 'balance_change',
  InProgress = 'simulation_in_progress',
}

export enum AssetType {
  Native = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
}

export enum FiatType {
  Available = 'available',
  NotAvailable = 'not_available',
}

export enum PetnameType {
  Saved = 'saved',
  Default = 'default',
  Unknown = 'unknown',
}

export function useSimulationMetrics({
  balanceChanges,
  loading,
  simulationData,
  transactionId,
  enableMetrics,
}: UseSimulationMetricsProps) {
  const { loadingTime, setLoadingComplete } = useLoadingTime();

  // TODO: Temporary pending multi-chain support in simulations.
  const chainId = useSelector(getCurrentChainId);

  if (!loading) {
    setLoadingComplete();
  }

  const displayNameRequests: UseDisplayNameRequest[] = balanceChanges
    // Filter out changes with no address (e.g. ETH)
    .filter(({ asset }) => Boolean(asset.address))
    .map(({ asset }) => ({
      value: asset.address as string,
      type: NameType.ETHEREUM_ADDRESS,
      preferContractSymbol: true,
      variation: chainId,
    }));

  const displayNames = useDisplayNames(displayNameRequests);

  const displayNamesByAddress = displayNames.reduce(
    (acc, displayNameResponse, index) => ({
      ...acc,
      [balanceChanges[index].asset.address ?? '']: displayNameResponse,
    }),
    {} as { [address: string]: UseDisplayNameResponse },
  );

  const { updateTransactionEventFragment } = useTransactionEventFragment();

  useIncompleteAssetEvent(balanceChanges, displayNamesByAddress);

  const receivingAssets = balanceChanges.filter(
    (change) => !change.amount.isNegative(),
  );

  const sendingAssets = balanceChanges.filter((change) =>
    change.amount.isNegative(),
  );

  const simulationResponse = getSimulationResponseType(simulationData);
  const simulationLatency = loadingTime;

  const properties = {
    simulation_response: simulationResponse,
    simulation_latency: simulationLatency,
    ...getProperties(
      receivingAssets,
      'simulation_receiving_assets_',
      displayNamesByAddress,
    ),
    ...getProperties(
      sendingAssets,
      'simulation_sending_assets_',
      displayNamesByAddress,
    ),
  };

  const sensitiveProperties = {
    ...getSensitiveProperties(receivingAssets, 'simulation_receiving_assets_'),
    ...getSensitiveProperties(sendingAssets, 'simulation_sending_assets_'),
  };

  const params = { properties, sensitiveProperties };

  const shouldSkipMetrics =
    !enableMetrics ||
    [
      SimulationErrorCode.ChainNotSupported,
      SimulationErrorCode.Disabled,
    ].includes(simulationData?.error?.code as SimulationErrorCode);

  useEffect(() => {
    if (shouldSkipMetrics) {
      return;
    }

    updateTransactionEventFragment(params, transactionId);
  }, [
    shouldSkipMetrics,
    updateTransactionEventFragment,
    transactionId,
    JSON.stringify(params),
  ]);
}

function useIncompleteAssetEvent(
  balanceChanges: BalanceChange[],
  displayNamesByAddress: {
    [address: string]: UseDisplayNameResponse | undefined;
  },
) {
  const trackEvent = useContext(MetaMetricsContext);
  const [processedAssets, setProcessedAssets] = useState<string[]>([]);

  for (const change of balanceChanges) {
    const assetAddress = change.asset.address ?? '';
    const displayName = displayNamesByAddress[assetAddress];

    const isIncomplete =
      (change.asset.address && !change.fiatAmount) ||
      getPetnameType(change, displayName) === PetnameType.Unknown;

    const isProcessed = processedAssets.includes(assetAddress);

    if (!isIncomplete || isProcessed) {
      continue;
    }

    trackEvent({
      event: MetaMetricsEventName.SimulationIncompleteAssetDisplayed,
      category: MetaMetricsEventCategory.Transactions,
      properties: {
        asset_address: change.asset.address,
        asset_petname: getPetnameType(change, displayName),
        asset_symbol: displayName?.contractDisplayName,
        asset_type: getAssetType(change.asset.standard),
        fiat_conversion_available: change.fiatAmount
          ? FiatType.Available
          : FiatType.NotAvailable,
        location: 'confirmation',
      },
    });

    setProcessedAssets([...processedAssets, assetAddress]);
  }
}

function getProperties(
  changes: BalanceChange[],
  prefix: string,
  displayNamesByAddress: { [address: string]: UseDisplayNameResponse },
) {
  const quantity = changes.length;

  const type = unique(
    changes.map((change) => getAssetType(change.asset.standard)),
  );

  const value = unique(
    changes.map((change) =>
      change.fiatAmount ? FiatType.Available : FiatType.NotAvailable,
    ),
  );

  const petname = unique(
    changes.map((change) =>
      getPetnameType(change, displayNamesByAddress[change.asset.address ?? '']),
    ),
  );

  return getPrefixProperties({ petname, quantity, type, value }, prefix);
}

function getSensitiveProperties(changes: BalanceChange[], prefix: string) {
  const fiatAmounts = changes.map((change) => change.fiatAmount);
  const totalFiat = calculateTotalFiat(fiatAmounts);
  const totalValue = totalFiat ? Math.abs(totalFiat) : undefined;

  return getPrefixProperties({ total_value: totalValue }, prefix);
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPrefixProperties(properties: Record<string, any>, prefix: string) {
  return Object.entries(properties).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [`${prefix}${key}`]: value,
    }),
    {},
  );
}

function getAssetType(standard: TokenStandard) {
  switch (standard) {
    case TokenStandard.ERC20:
      return AssetType.ERC20;
    case TokenStandard.ERC721:
      return AssetType.ERC721;
    case TokenStandard.ERC1155:
      return AssetType.ERC1155;
    default:
      return AssetType.Native;
  }
}

function getPetnameType(
  balanceChange: BalanceChange,
  displayName: UseDisplayNameResponse = { name: '', hasPetname: false },
) {
  if (balanceChange.asset.standard === TokenStandard.none) {
    return PetnameType.Default;
  }

  if (displayName.hasPetname) {
    return PetnameType.Saved;
  }

  if (displayName.name) {
    return PetnameType.Default;
  }

  return PetnameType.Unknown;
}

function getSimulationResponseType(
  simulationData?: SimulationData,
): SimulationResponseType {
  if (!simulationData) {
    return SimulationResponseType.InProgress;
  }

  if (simulationData.error?.code === SimulationErrorCode.Reverted) {
    return SimulationResponseType.Reverted;
  }

  if (simulationData.error) {
    return SimulationResponseType.Failed;
  }

  if (
    !simulationData?.nativeBalanceChange &&
    !simulationData?.tokenBalanceChanges.length
  ) {
    return SimulationResponseType.NoChanges;
  }

  return SimulationResponseType.Changes;
}

function unique<T>(list: T[]): T[] {
  return Array.from(new Set(list));
}
