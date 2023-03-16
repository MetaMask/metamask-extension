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
import { ICON_NAMES, Text } from '../../component-library';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
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
      event: EVENT_NAMES.EXTERNAL_LINK_CLICKED,
      category: EVENT.CATEGORIES.NAVIGATION,
      properties: {
        link_type: EVENT.EXTERNAL_LINK_TYPES.ACCOUNT_TRACKER,
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
        iconName={ICON_NAMES.EXPORT}
        data-testid="account-list-menu-open-explorer"
      >
        <Text variant={TextVariant.bodySm}>{t('viewOnExplorer')}</Text>
      </MenuItem>
      <MenuItem
        onClick={() => {
          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
          trackEvent({
            event: EVENT_NAMES.NAV_ACCOUNT_DETAILS_OPENED,
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              location: 'Account Options',
            },
          });
          onClose();
          closeMenu?.();
        }}
        iconName={ICON_NAMES.SCAN_BARCODE}
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
          iconName={ICON_NAMES.TRASH}
        >
          <Text variant={TextVariant.bodySm}>{t('removeAccount')}</Text>
        </MenuItem>
      ) : null}
    </Menu>
  );
};

AccountListItemMenu.propTypes = {
  anchorElement: PropTypes.instanceOf(window.Element),
  onClose: PropTypes.func.isRequired,
  closeMenu: PropTypes.func,
  blockExplorerUrlSubTitle: PropTypes.string,
  isRemovable: PropTypes.bool.isRequired,
  identity: PropTypes.object.isRequired,
};
