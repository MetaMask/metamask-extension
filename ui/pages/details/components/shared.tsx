import React, { ReactNode } from 'react';
import { Text } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import { formatBlockExplorerTransactionUrl } from '../../../../shared/lib/multichain/networks';
import { isValidTransactionHash } from '../../../../shared/lib/transactions.utils';

export function getExplorerTxUrl({
  chainId,
  txHash,
  blockExplorerUrl,
}: {
  chainId: string;
  txHash: string | undefined;
  blockExplorerUrl: string | undefined;
}): string | undefined {
  const txId =
    txHash && (!chainId.startsWith('eip155:') || isValidTransactionHash(txHash))
      ? txHash
      : undefined;

  if (!txId) {
    return undefined;
  }

  const nonEvmExplorerUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
      chainId as MultichainNetworks
    ];

  if (nonEvmExplorerUrls) {
    return formatBlockExplorerTransactionUrl(nonEvmExplorerUrls, txId);
  }

  const hexChainId = getMaybeHexChainId(chainId);
  const explorerRoot =
    blockExplorerUrl ??
    (hexChainId ? CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexChainId] : '');

  if (!explorerRoot) {
    return undefined;
  }

  return `${explorerRoot.replace(/\/$/u, '')}/tx/${txId}`;
}

export function useBlockExplorerUrl(
  chainId: string,
  txHash: string | undefined,
): string | undefined {
  const networkConfigurations = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const networkConfig = networkConfigurations[chainId];
  const blockExplorerUrl =
    networkConfig && 'blockExplorerUrls' in networkConfig
      ? networkConfig.blockExplorerUrls?.[
          networkConfig.defaultBlockExplorerUrlIndex ?? -1
        ]
      : undefined;

  return getExplorerTxUrl({ chainId, txHash, blockExplorerUrl });
}

export function Row({
  label,
  value,
  testId = 'transaction-breakdown-row',
}: {
  label: string;
  value: ReactNode;
  testId?: string;
}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <div
      className="flex items-start justify-between gap-4 py-2"
      data-testid={testId}
    >
      <Text
        className="text-alternative @compact:text-s-body-sm"
        data-testid="transaction-breakdown-row-title"
      >
        {label}
      </Text>

      <div
        className="min-w-0 break-words text-end @compact:text-s-body-sm"
        data-testid="transaction-breakdown-row-value"
      >
        {value}
      </div>
    </div>
  );
}

export function Section({ children }: Readonly<{ children: ReactNode }>) {
  return <section className="py-2 empty:hidden">{children}</section>;
}

export function Footer({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="mt-auto flex flex-col gap-4 pt-4">{children}</div>;
}
