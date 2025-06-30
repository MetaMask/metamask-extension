import React, { useContext } from 'react';
import type { CaipChainId } from '@metamask/utils';
import {
  formatChainIdToHex,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP } from '../../../../shared/constants/common';
import {
  Box,
  IconName,
  ButtonSecondary,
} from '../../../components/component-library';
import { openBlockExplorer } from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

const getBlockExplorerName = (
  chainId: CaipChainId | undefined,
  blockExplorerUrl: string | undefined,
) => {
  const hexChainId =
    chainId && !isSolanaChainId(chainId)
      ? formatChainIdToHex(chainId)
      : undefined;
  const humanReadableUrl = hexChainId
    ? CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP[hexChainId]
    : undefined;
  if (humanReadableUrl) {
    return humanReadableUrl;
  }

  if (!blockExplorerUrl) {
    return undefined;
  }
  return blockExplorerUrl.split('/')[2];
};

const METRICS_LOCATION = 'Activity Tab';

type ExplorerLinksProps = {
  srcChainId?: CaipChainId;
  destChainId?: CaipChainId;
  srcBlockExplorerUrl?: string;
  destBlockExplorerUrl?: string;
};

export default function BridgeExplorerLinks({
  srcChainId,
  destChainId,
  srcBlockExplorerUrl,
  destBlockExplorerUrl,
}: ExplorerLinksProps) {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  // Not sure why but the text is not being changed to white on hover, unless it's put into a variable before the render
  const srcButtonText = t('bridgeExplorerLinkViewOn', [
    getBlockExplorerName(srcChainId, srcBlockExplorerUrl),
  ]);
  const destButtonText = destBlockExplorerUrl
    ? t('bridgeExplorerLinkViewOn', [
        getBlockExplorerName(destChainId, destBlockExplorerUrl),
      ])
    : undefined;

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      {srcBlockExplorerUrl && (
        <ButtonSecondary
          endIconName={IconName.Export}
          onClick={() => {
            if (srcBlockExplorerUrl) {
              openBlockExplorer(
                srcBlockExplorerUrl,
                METRICS_LOCATION,
                trackEvent,
              );
            }
          }}
        >
          {srcButtonText}
        </ButtonSecondary>
      )}
      {destBlockExplorerUrl && (
        <ButtonSecondary
          endIconName={IconName.Export}
          onClick={() => {
            if (destBlockExplorerUrl) {
              openBlockExplorer(
                destBlockExplorerUrl,
                METRICS_LOCATION,
                trackEvent,
              );
            }
          }}
        >
          {destButtonText}
        </ButtonSecondary>
      )}
    </Box>
  );
}
