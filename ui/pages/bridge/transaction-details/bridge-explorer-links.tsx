import React from 'react';
import type { CaipChainId } from '@metamask/utils';
import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP } from '../../../../shared/constants/common';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  IconName,
  ButtonSecondary,
} from '../../../components/component-library';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getURLHostName } from '../../../helpers/utils/util';

const getBlockExplorerName = (
  chainId: CaipChainId | undefined,
  blockExplorerUrl: string | undefined,
) => {
  const hexChainId =
    chainId && !isNonEvmChainId(chainId)
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function BridgeExplorerLinks({
  srcChainId,
  destChainId,
  srcBlockExplorerUrl,
  destBlockExplorerUrl,
}: ExplorerLinksProps) {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();

  const openExplorer = (url: string) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ExternalLinkClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          link_type: MetaMetricsEventLinkType.AccountTracker,
          location: METRICS_LOCATION,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          url_domain: getURLHostName(url),
        })
        .build(),
    );
    global.platform.openTab({ url });
  };

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
    <Box className="flex" flexDirection={BoxFlexDirection.Column} gap={4}>
      {srcBlockExplorerUrl && (
        <ButtonSecondary
          endIconName={IconName.Export}
          onClick={() => {
            openExplorer(srcBlockExplorerUrl);
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
              openExplorer(destBlockExplorerUrl);
            }
          }}
        >
          {destButtonText}
        </ButtonSecondary>
      )}
    </Box>
  );
}
