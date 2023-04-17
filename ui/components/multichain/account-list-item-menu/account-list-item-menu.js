import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getRpcPrefsForCurrentProvider,
  getBlockExplorerLinkText,
  getCurrentChainId,
} from '../../../selectors';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { Menu, MenuItem } from '../../ui/menu';
import { Text, IconName } from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { showModal } from '../../../store/actions';
import { TextVariant } from '../../../helpers/constants/design-system';

export const AccountListItemMenu = ({
  anchorElement,
  blockExplorerUrlSubTitle,
  onClose,
  closeMenu,
  isRemovable,
  identity,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const addressLink = getAccountLink(identity.address, chainId, rpcPrefs);

  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);
  const openBlockExplorer = () => {
    trackEvent({
      event: MetaMetricsEventName.ExternalLinkClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        link_type: MetaMetricsEventLinkType.AccountTracker,
        location: 'Account Options',
        url_domain: getURLHostName(addressLink),
      },
    });
    global.platform.openTab({
      url: addressLink,
    });
    onClose();
  };

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  return (
    <Menu
      anchorElement={anchorElement}
      className="account-list-item-menu"
      onHide={onClose}
    >
      <MenuItem
        onClick={
          blockExplorerLinkText.firstPart === 'addBlockExplorer'
            ? routeToAddBlockExplorerUrl
            : openBlockExplorer
        }
        subtitle={blockExplorerUrlSubTitle || null}
        iconName={IconName.Export}
        data-testid="account-list-menu-open-explorer"
      >
        <Text variant={TextVariant.bodySm}>{t('viewOnExplorer')}</Text>
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (process.env.MULTICHAIN) {
            dispatch(
              showModal({
                name: 'MULTICHAIN_ACCOUNT_DETAILS',
                identity,
              }),
            );
          } else {
            dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
          }
          trackEvent({
            event: MetaMetricsEventName.NavAccountDetailsOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: 'Account Options',
            },
          });
          onClose();
          closeMenu?.();
        }}
        iconName={IconName.ScanBarcode}
      >
        <Text variant={TextVariant.bodySm}>{t('accountDetails')}</Text>
      </MenuItem>
      {isRemovable ? (
        <MenuItem
          data-testid="account-list-menu-remove"
          onClick={() => {
            dispatch(
              showModal({
                name: 'CONFIRM_REMOVE_ACCOUNT',
                identity,
              }),
            );
            onClose();
          }}
          iconName={IconName.Trash}
        >
          <Text variant={TextVariant.bodySm}>{t('removeAccount')}</Text>
        </MenuItem>
      ) : null}
    </Menu>
  );
};

AccountListItemMenu.propTypes = {
  /**
   * Element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that executes when the menu is closed
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Function that closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * Domain of the block explorer
   */
  blockExplorerUrlSubTitle: PropTypes.string,
  /**
   * Represents if the account should be removable
   */
  isRemovable: PropTypes.bool.isRequired,
  /**
   * Identity of the account
   */
  /**
   * Identity of the account
   */
  identity: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
  }).isRequired,
};
