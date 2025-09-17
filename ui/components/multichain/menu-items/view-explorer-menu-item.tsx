import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';

import { parseCaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getMultichainAccountUrl,
  getMultichainBlockExplorerUrl,
} from '../../../helpers/utils/multichain/blockExplorer';

import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { IconName, Text } from '../../component-library';
import {
  getBlockExplorerLinkText,
  getIsCustomNetwork,
} from '../../../selectors';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  TEST_NETWORK_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';

export type ViewExplorerMenuItemProps = {
  /**
   * Represents the "location" property of the metrics event
   */
  metricsLocation: string;
  /**
   * Closes the menu
   */
  closeMenu?: () => void;
  /**
   * Custom properties for the menu item text
   */
  textProps?: object;
  /**
   * Account to show account details for
   */
  account: InternalAccount;
};

export const openBlockExplorer = (
  addressLink: string,
  metricsLocation: string,
  trackEvent: (
    payload: MetaMetricsEventPayload,
    options?: MetaMetricsEventOptions,
  ) => Promise<void>,
  closeMenu?: () => void,
) => {
  trackEvent({
    event: MetaMetricsEventName.ExternalLinkClicked,
    category: MetaMetricsEventCategory.Navigation,
    properties: {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      link_type: MetaMetricsEventLinkType.AccountTracker,
      location: metricsLocation,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      url_domain: getURLHostName(addressLink),
    },
  });

  global.platform.openTab({
    url: addressLink,
  });
  closeMenu?.();
};

export const ViewExplorerMenuItem = ({
  metricsLocation,
  closeMenu,
  textProps,
  account,
}: ViewExplorerMenuItemProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const navigate = useNavigate();

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    account,
  );
  const addressLink = getMultichainAccountUrl(
    account.address,
    multichainNetwork,
  );
  // TODO: Re-use CAIP-2 for metrics once event schemas support it
  const chainId = parseCaipChainId(multichainNetwork.chainId).reference;
  const blockExplorerUrl = getMultichainBlockExplorerUrl(multichainNetwork);

  // For EIP155 networks, determine subtitle based on network type
  const { namespace } = parseCaipChainId(multichainNetwork.chainId);
  const isCustomNetwork = useSelector(getIsCustomNetwork);
  const currentChainId = useSelector(getCurrentChainId);
  const isTestNetwork = (TEST_NETWORK_IDS as string[]).includes(currentChainId);

  const isPopularNetwork = Boolean(
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[currentChainId],
  );

  let blockExplorerUrlSubTitle = null;
  let actualAddressLink = addressLink;

  if (namespace === 'eip155') {
    // For test networks and custom networks, show actual block explorer URL
    if (isTestNetwork || (!isPopularNetwork && isCustomNetwork)) {
      blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);
      // network-specific explorer URL for navigation
      if (blockExplorerUrl) {
        const normalizedAddress = account.address;
        const baseUrl = blockExplorerUrl.endsWith('/')
          ? blockExplorerUrl
          : `${blockExplorerUrl}/`;
        actualAddressLink = `${baseUrl}address/${normalizedAddress}`;
      }
    } else {
      // For popular networks, show etherscan.io
      blockExplorerUrlSubTitle = 'etherscan.io';
    }
  } else {
    // For non-EIP155 networks, always show actual block explorer URL
    blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);
  }

  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);

  const routeToAddBlockExplorerUrl = () => {
    navigate(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const LABEL = t('viewOnExplorer');

  return (
    <MenuItem
      onClick={() => {
        blockExplorerLinkText.firstPart === 'addBlockExplorer'
          ? routeToAddBlockExplorerUrl()
          : openBlockExplorer(
              actualAddressLink,
              metricsLocation,
              trackEvent,
              closeMenu,
            );

        trackEvent({
          event: MetaMetricsEventName.BlockExplorerLinkClicked,
          category: MetaMetricsEventCategory.Accounts,
          properties: {
            location: metricsLocation,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: chainId,
          },
        });

        closeMenu?.();
      }}
      subtitle={blockExplorerUrlSubTitle || null}
      iconName={IconName.Export}
      data-testid="account-list-menu-open-explorer"
    >
      {textProps ? <Text {...textProps}>{LABEL}</Text> : LABEL}
    </MenuItem>
  );
};
