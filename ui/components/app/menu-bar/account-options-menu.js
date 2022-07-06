import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';

import { showModal } from '../../../store/actions';
import {
  CONNECTED_ROUTE,
  NETWORKS_ROUTE,
} from '../../../helpers/constants/routes';
import { getURLHostName } from '../../../helpers/utils/util';
import { Menu, MenuItem } from '../../ui/menu';
import {
  getBlockExplorerLinkText,
  getCurrentChainId,
  getCurrentKeyring,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { EVENT } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function AccountOptionsMenu({ anchorElement, onClose }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const keyring = useSelector(getCurrentKeyring);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const selectedIdentity = useSelector(getSelectedIdentity);
  const { address } = selectedIdentity;
  const addressLink = getAccountLink(address, chainId, rpcPrefs);
  const { blockExplorerUrl } = rpcPrefs;
  const blockExplorerUrlSubTitle = getURLHostName(blockExplorerUrl);
  const trackEvent = useContext(MetaMetricsContext);
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);

  const isRemovable = keyring.type !== 'HD Key Tree';

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const openBlockExplorer = () => {
    trackEvent({
      event: 'Clicked Block Explorer Link',
      category: EVENT.CATEGORIES.NAVIGATION,
      properties: {
        link_type: 'Account Tracker',
        action: 'Account Options',
        block_explorer_domain: getURLHostName(addressLink),
      },
    });
    global.platform.openTab({
      url: addressLink,
    });
    onClose();
  };

  return (
    <Menu
      anchorElement={anchorElement}
      className="account-options-menu"
      onHide={onClose}
    >
      <MenuItem
        onClick={
          blockExplorerLinkText.firstPart === 'addBlockExplorer'
            ? routeToAddBlockExplorerUrl
            : openBlockExplorer
        }
        subtitle={
          blockExplorerUrlSubTitle ? (
            <span className="account-options-menu__explorer-origin">
              {blockExplorerUrlSubTitle}
            </span>
          ) : null
        }
        iconClassName="fas fa-external-link-alt"
      >
        {t(
          blockExplorerLinkText.firstPart,
          blockExplorerLinkText.secondPart === ''
            ? null
            : [t(blockExplorerLinkText.secondPart)],
        )}
      </MenuItem>
      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
        <MenuItem
          onClick={() => {
            trackEvent({
              event: 'Clicked Expand View',
              category: EVENT.CATEGORIES.NAVIGATION,
              properties: {
                action: 'Account Options',
                legacy_event: true,
              },
            });
            global.platform.openExtensionInBrowser();
            onClose();
          }}
          iconClassName="fas fa-expand-alt"
        >
          {t('expandView')}
        </MenuItem>
      )}
      <MenuItem
        data-testid="account-options-menu__account-details"
        onClick={() => {
          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
          trackEvent({
            event: 'Viewed Account Details',
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              action: 'Account Options',
              legacy_event: true,
            },
          });
          onClose();
        }}
        iconClassName="fas fa-qrcode"
      >
        {t('accountDetails')}
      </MenuItem>
      <MenuItem
        data-testid="account-options-menu__connected-sites"
        onClick={() => {
          trackEvent({
            event: 'Opened Connected Sites',
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              action: 'Account Options',
              legacy_event: true,
            },
          });
          history.push(CONNECTED_ROUTE);
          onClose();
        }}
        iconClassName="fa fa-bullseye"
      >
        {t('connectedSites')}
      </MenuItem>
      {isRemovable ? (
        <MenuItem
          data-testid="account-options-menu__remove-account"
          onClick={() => {
            dispatch(
              showModal({
                name: 'CONFIRM_REMOVE_ACCOUNT',
                identity: selectedIdentity,
              }),
            );
            onClose();
          }}
          iconClassName="fas fa-trash-alt"
        >
          {t('removeAccount')}
        </MenuItem>
      ) : null}
    </Menu>
  );
}

AccountOptionsMenu.propTypes = {
  anchorElement: PropTypes.instanceOf(window.Element),
  onClose: PropTypes.func.isRequired,
};

AccountOptionsMenu.defaultProps = {
  anchorElement: undefined,
};
