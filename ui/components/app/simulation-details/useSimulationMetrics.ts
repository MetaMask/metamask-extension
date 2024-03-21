import { SimulationData } from '@metamask/transaction-controller';
import { BalanceChange } from './types';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { calculateTotalFiat } from './fiat-display';
import { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTransactionEventFragment } from '../../../pages/confirmations/hooks/useTransactionEventFragment';
import {
  UseDisplayNameRequest,
  UseDisplayNameResponse,
  useDisplayNames,
} from '../../../hooks/useDisplayName';
import { NameType } from '@metamask/name-controller';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export type UseSimulationMetricsProps = {
  balanceChanges: BalanceChange[];
  loadingTime?: number;
  simulationData?: SimulationData;
  transactionId: string;
};

enum SimulationResponseType {
  Failed = 'failed',
  Reverted = 'transaction_revert',
  NoChanges = 'no_balance_change',
  Changes = 'balance_change',
  InProgress = 'simulation_in_progress',
}

enum AssetType {
  Native = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
}

enum FiatType {
  Available = 'available',
  NotAvailable = 'not_available',
}

enum PetnameType {
  Saved = 'saved',
  Default = 'default',
  Unknown = 'unknown',
}

export function useSimulationMetrics({
  balanceChanges,
  loadingTime,
  simulationData,
  transactionId,
}: UseSimulationMetricsProps) {
  const dispatch = useDispatch();

  const displayNameRequests: UseDisplayNameRequest[] = balanceChanges.map(
    ({ asset }) => ({
      value: asset.address ?? '',
      type: NameType.ETHEREUM_ADDRESS,
      preferContractSymbol: true,
    }),
  );

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
    (change) => !change.amount.isNegative,
  );

  const sendingAssets = balanceChanges.filter(
    (change) => change.amount.isNegative,
  );

  const simulation_response = getSimulationResponseType(simulationData);
  const simulation_latency = loadingTime;

  const properties = {
    simulation_response,
    simulation_latency,
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

  useEffect(() => {
    updateTransactionEventFragment(
      { properties, sensitiveProperties },
      transactionId,
    );
  }, [dispatch, transactionId, JSON.stringify(properties)]);
}

function useIncompleteAssetEvent(
  balanceChanges: BalanceChange[],
  displayNamesByAddress: { [address: string]: UseDisplayNameResponse },
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
        asset_symbol: displayName.contractDisplayName,
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

  const type = changes.map((change) => getAssetType(change.asset.standard));

  const value = changes.map((change) =>
    change.fiatAmount ? FiatType.Available : FiatType.NotAvailable,
  );

  const petname = changes.map((change) =>
    getPetnameType(change, displayNamesByAddress[change.asset.address ?? '']),
  );

  return getPrefixProperties({ petname, quantity, type, value }, prefix);
}

function getSensitiveProperties(changes: BalanceChange[], prefix: string) {
  const total_value = calculateTotalFiat(changes);

  return getPrefixProperties({ total_value }, prefix);
}

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
    case TokenStandard.none:
      return AssetType.Native;
    case TokenStandard.ERC20:
      return AssetType.ERC20;
    case TokenStandard.ERC721:
      return AssetType.ERC721;
    case TokenStandard.ERC1155:
      return AssetType.ERC1155;
  }
}

function getPetnameType(
  balanceChange: BalanceChange,
  displayName: UseDisplayNameResponse,
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

  if (simulationData.error?.isReverted) {
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
