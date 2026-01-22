import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  ButtonIcon,
  ButtonIconSize,
} from '../../../../../components/component-library';
import { IconColor } from '../../../../../helpers/constants/design-system';
import { IconName } from '../../../../../components/component-library/icon';
import { selectNetworkConfigurationByChainId } from '../../../../../selectors';

type BlockExplorerLinkProps = {
  chainId: Hex;
  hash: string | undefined;
};

function getBlockExplorerTxUrl(
  blockExplorerUrl: string | undefined,
  txHash: string | undefined,
): string | undefined {
  if (blockExplorerUrl && txHash) {
    const rootUrl = blockExplorerUrl.replace(/\/$/u, '');
    return `${rootUrl}/tx/${txHash}`;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function BlockExplorerLink({ chainId, hash }: BlockExplorerLinkProps) {
  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const blockExplorerUrl = useMemo(() => {
    if (!networkConfiguration) {
      return undefined;
    }
    const { defaultBlockExplorerUrlIndex, blockExplorerUrls } =
      networkConfiguration;
    if (defaultBlockExplorerUrlIndex === undefined) {
      return undefined;
    }
    return blockExplorerUrls?.[defaultBlockExplorerUrlIndex];
  }, [networkConfiguration]);

  const explorerTxUrl = getBlockExplorerTxUrl(blockExplorerUrl, hash);

  const handleClick = useCallback(() => {
    if (explorerTxUrl) {
      global.platform.openTab({ url: explorerTxUrl });
    }
  }, [explorerTxUrl]);

  if (!explorerTxUrl) {
    return null;
  }

  return (
    <ButtonIcon
      iconName={IconName.Export}
      size={ButtonIconSize.Sm}
      color={IconColor.iconAlternative}
      ariaLabel="View on block explorer"
      onClick={handleClick}
      data-testid="block-explorer-link"
    />
  );
}
