import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';

import { showModal } from '../../../store/actions';
import { CONNECTED_ROUTE } from '../../../helpers/constants/routes';
import { Menu, MenuItem } from '../../ui/menu';
import {
  getCurrentChainId,
  getCurrentKeyring,
  getRpcPrefsForCurrentProvider,
  getSelectedIdentity,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useMetricEvent,
  useNewMetricEvent,
} from '../../../hooks/useMetricEvent';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';

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

  const openFullscreenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Account Options',
      name: 'Clicked Expand View',
    },
  });
  const viewAccountDetailsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Account Options',
      name: 'Viewed Account Details',
    },
  });

  const openConnectedSitesEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Account Options',
      name: 'Opened Connected Sites',
    },
  });

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Navigation',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Account Tracker',
      action: 'Account Options',
      block_explorer_domain: addressLink ? new URL(addressLink)?.hostname : '',
    },
  });

  const isRemovable = keyring.type !== 'HD Key Tree';

  return (
    <Menu
      anchorElement={anchorElement}
      className="account-options-menu"
      onHide={onClose}
    >
      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
        <MenuItem
          onClick={() => {
            openFullscreenEvent();
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
          viewAccountDetailsEvent();
          onClose();
        }}
        iconClassName="fas fa-qrcode"
      >
        {t('accountDetails')}
      </MenuItem>
      <MenuItem
        onClick={() => {
          blockExplorerLinkClickedEvent();
          global.platform.openTab({
            url: addressLink,
          });
          onClose();
        }}
        subtitle={
          rpcPrefs.blockExplorerUrl ? (
            <span className="account-options-menu__explorer-origin">
              {rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/u)[1]}
            </span>
          ) : null
        }
        iconClassName="fas fa-external-link-alt"
      >
        {rpcPrefs.blockExplorerUrl ? t('viewinExplorer') : t('viewOnEtherscan')}
      </MenuItem>
      <MenuItem
        data-testid="account-options-menu__connected-sites"
        onClick={() => {
          openConnectedSitesEvent();
          history.push(CONNECTED_ROUTE);
          onClose();
        }}
        iconClassName="account-options-menu__connected-sites"
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
