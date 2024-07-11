import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { parseCaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-api';
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
import { getBlockExplorerLinkText } from '../../../selectors';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';

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
      link_type: MetaMetricsEventLinkType.AccountTracker,
      location: metricsLocation,
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
  const history = useHistory();

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
  const blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const LABEL = t('viewOnExplorer');

  return (
    // @ts-expect-error - TODO: Fix MenuItem props types
    <MenuItem
      onClick={() => {
        blockExplorerLinkText.firstPart === 'addBlockExplorer'
          ? routeToAddBlockExplorerUrl()
          : openBlockExplorer(
              addressLink,
              metricsLocation,
              trackEvent,
              closeMenu,
            );

        trackEvent({
          event: MetaMetricsEventName.BlockExplorerLinkClicked,
          category: MetaMetricsEventCategory.Accounts,
          properties: {
            location: metricsLocation,
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
