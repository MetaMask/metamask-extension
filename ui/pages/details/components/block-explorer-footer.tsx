import React, { useCallback } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import { formatBlockExplorerTransactionUrl } from '../../../../shared/lib/multichain/networks';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';

function getExplorerTxUrl({
  chainId,
  txHash,
  blockExplorerUrl,
}: {
  chainId: string;
  txHash: string | undefined;
  blockExplorerUrl: string | undefined;
}) {
  if (!txHash) {
    return undefined;
  }

  const nonEvmExplorerUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[
      chainId as MultichainNetworks
    ];

  if (nonEvmExplorerUrls) {
    return formatBlockExplorerTransactionUrl(nonEvmExplorerUrls, txHash);
  }

  const hexChainId = getMaybeHexChainId(chainId);

  const explorerRoot =
    blockExplorerUrl ??
    (hexChainId ? CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[hexChainId] : '');

  if (!explorerRoot) {
    return undefined;
  }

  return `${explorerRoot.replace(/\/$/u, '')}/tx/${txHash}`;
}

type Props = {
  chainId: string | undefined;
  txHash: string | undefined;
};

export function BlockExplorerFooter({ chainId, txHash }: Props) {
  const t = useI18nContext();
  const networkConfigurations = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const networkConfiguration = chainId
    ? networkConfigurations[chainId]
    : undefined;

  const blockExplorerUrl =
    networkConfiguration && 'blockExplorerUrls' in networkConfiguration
      ? networkConfiguration.blockExplorerUrls?.[
          networkConfiguration.defaultBlockExplorerUrlIndex ?? -1
        ]
      : undefined;

  const explorerTxUrl = getExplorerTxUrl({
    chainId: chainId ?? '',
    txHash,
    blockExplorerUrl,
  });

  const handleClick = useCallback(() => {
    if (explorerTxUrl) {
      global.platform.openTab({ url: explorerTxUrl });
    }
  }, [explorerTxUrl]);

  if (!explorerTxUrl) {
    return null;
  }

  return (
    <Button
      className="w-full"
      size={ButtonSize.Lg}
      variant={ButtonVariant.Secondary}
      onClick={handleClick}
    >
      {t('viewOnBlockExplorer')}
    </Button>
  );
}
