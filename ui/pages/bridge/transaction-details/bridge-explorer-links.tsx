import { NetworkConfiguration } from '@metamask/network-controller';
import React, { useContext } from 'react';
import {
  Box,
  Button,
  Icon,
  IconName,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { openBlockExplorer } from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

const getBlockExplorerName = (blockExplorerUrl: string | undefined) => {
  if (!blockExplorerUrl) {
    return undefined;
  }
  return blockExplorerUrl.split('/')[2];
};

export const getBlockExplorerUrl = (
  networkConfiguration: NetworkConfiguration | undefined,
  txHash: string | undefined,
) => {
  if (!networkConfiguration || !txHash) {
    return undefined;
  }
  const index = networkConfiguration.defaultBlockExplorerUrlIndex;
  if (index === undefined) {
    return undefined;
  }

  const rootUrl = networkConfiguration.blockExplorerUrls[index]?.replace(
    /\/$/g,
    '',
  );
  return `${rootUrl}/tx/${txHash}`;
};

const METRICS_LOCATION = 'Activity Tab';

type ExplorerLinksProps = {
  srcBlockExplorerUrl?: string;
  destBlockExplorerUrl?: string;
};

export default function BridgeExplorerLinks({
  srcBlockExplorerUrl,
  destBlockExplorerUrl,
}: ExplorerLinksProps) {
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
      <Button
        variant={ButtonVariant.Secondary}
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
        <Text>View on {getBlockExplorerName(srcBlockExplorerUrl)}</Text>
        <Icon name={IconName.Export} />
      </Button>
      <Button
        variant={ButtonVariant.Secondary}
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
        <div>View on {getBlockExplorerName(destBlockExplorerUrl)}</div>
        <Icon name={IconName.Export} />
      </Button>
    </Box>
  );
}
