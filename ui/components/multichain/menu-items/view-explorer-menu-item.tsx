import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { parseCaipChainId } from '@metamask/utils';
import {
  getMultichainAccountLink,
  getMultichainBlockexplorerUrl,
} from '../../../helpers/utils/multichain/blockExplorer';

import { MenuItem } from '../../ui/menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { IconName, Text } from '../../component-library';
import { getBlockExplorerLinkText } from '../../../selectors';
import { getURLHostName } from '../../../helpers/utils/util';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import {
  InternalAccountPropType,
  getMultichainNetwork,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';

export type ViewExplorerMenuItemProps = {
  metricsLocation: string;
  closeMenu?: () => void;
  textProps?: object;
  account: object;
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
  const addressLink = getMultichainAccountLink(account, multichainNetwork);

  const chainId = parseCaipChainId(multichainNetwork.chainId).reference;
  const blockExplorerUrl = getMultichainBlockexplorerUrl(
    account,
    multichainNetwork,
  );
  const blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);
  const openBlockExplorer = () => {
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
          : openBlockExplorer();

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

ViewExplorerMenuItem.propTypes = {
  /**
   * Represents the "location" property of the metrics event
   */
  metricsLocation: PropTypes.string.isRequired,
  /**
   * Closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * Account to show account details for
   */
  account: InternalAccountPropType.isRequired,
  /**
   * Custom properties for the menu item text
   */
  textProps: PropTypes.object,
};
