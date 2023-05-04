import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';

import { showModal } from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
///: END:ONLY_INCLUDE_IN
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
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getMetaMaskAccountsOrdered,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IN
import { KeyringType } from '../../../../shared/constants/keyring';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { IconName } from '../../component-library';

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

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const isCustodial = /Custody/u.test(keyring.type);
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IN

  const isRemovable = keyring.type !== KeyringType.hdKeyTree;

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

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
        iconName={IconName.Export}
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
              event: MetaMetricsEventName.AppWindowExpanded,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: 'Account Options',
              },
            });
            global.platform.openExtensionInBrowser();
            onClose();
          }}
          iconName={IconName.Expand}
        >
          {t('expandView')}
        </MenuItem>
      )}
      <MenuItem
        data-testid="account-options-menu__account-details"
        onClick={() => {
          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
          trackEvent({
            event: MetaMetricsEventName.NavAccountDetailsOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: 'Account Options',
            },
          });
          onClose();
        }}
        iconName={IconName.ScanBarcode}
      >
        {t('accountDetails')}
      </MenuItem>
      <MenuItem
        data-testid="account-options-menu__connected-sites"
        onClick={() => {
          trackEvent({
            event: MetaMetricsEventName.NavConnectedSitesOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: 'Account Options',
            },
          });
          history.push(CONNECTED_ROUTE);
          onClose();
        }}
        iconName={IconName.Connect}
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
          iconName={IconName.Trash}
        >
          {t('removeAccount')}
        </MenuItem>
      ) : null}
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        isCustodial ? (
          <MenuItem
            data-testid="account-options-menu__remove-jwt"
            onClick={async () => {
              const token = await dispatch(mmiActions.getCustodianToken());
              const custodyAccountDetails = await dispatch(
                mmiActions.getAllCustodianAccountsWithToken(
                  keyring.type.split(' - ')[1],
                  token,
                ),
              );
              dispatch(
                showModal({
                  name: 'CONFIRM_REMOVE_JWT',
                  token,
                  custodyAccountDetails,
                  accounts,
                  selectedAddress: toChecksumHexAddress(address),
                }),
              );
              onClose();
            }}
            iconClassName="fas fa-trash-alt"
          >
            {t('removeJWT')}
          </MenuItem>
        ) : null

        ///: END:ONLY_INCLUDE_IN
      }
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
