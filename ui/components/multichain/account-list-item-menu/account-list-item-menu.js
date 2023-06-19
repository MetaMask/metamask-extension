import React, { useContext, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
///: END:ONLY_INCLUDE_IN
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getRpcPrefsForCurrentProvider,
  getBlockExplorerLinkText,
  getCurrentChainId,
  getHardwareWalletType,
  getAccountTypeForKeyring,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getMetaMaskAccountsOrdered,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IN
import { findKeyringForAddress } from '../../../ducks/metamask/metamask';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { MenuItem } from '../../ui/menu';
import {
  Text,
  IconName,
  Popover,
  PopoverPosition,
  ModalFocus,
  PopoverRole,
} from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventLinkType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { setAccountDetailsAddress, showModal } from '../../../store/actions';
import { TextVariant } from '../../../helpers/constants/design-system';
import { formatAccountType } from '../../../helpers/utils/metrics';

export const AccountListItemMenu = ({
  anchorElement,
  blockExplorerUrlSubTitle,
  onClose,
  closeMenu,
  isRemovable,
  identity,
  isOpen,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const addressLink = getAccountLink(identity.address, chainId, rpcPrefs);

  const deviceName = useSelector(getHardwareWalletType);

  const keyring = useSelector((state) =>
    findKeyringForAddress(state, identity.address),
  );
  const accountType = formatAccountType(getAccountTypeForKeyring(keyring));

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

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const isCustodial = keyring?.type ? /Custody/u.test(keyring.type) : false;
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IN

  // Handle Tab key press for accessibility inside the popover and will close the popover on the last MenuItem
  const lastItemRef = useRef(null);
  const accountDetailsItemRef = useRef(null);
  const removeAccountItemRef = useRef(null);
  const removeJWTItemRef = useRef(null);

  // Checks the MenuItems from the bottom to top to set lastItemRef on the last MenuItem that is not disabled
  useEffect(() => {
    if (removeJWTItemRef.current) {
      lastItemRef.current = removeJWTItemRef.current;
    } else if (removeAccountItemRef.current) {
      lastItemRef.current = removeAccountItemRef.current;
    } else {
      lastItemRef.current = accountDetailsItemRef.current;
    }
  }, [
    removeJWTItemRef.current,
    removeAccountItemRef.current,
    accountDetailsItemRef.current,
  ]);

  const handleKeyDown = (event) => {
    if (event.key === 'Tab' && event.target === lastItemRef.current) {
      // If Tab is pressed at the last item to close popover and focus to next element in DOM
      onClose();
    }
  };

  // Handle click outside of the popover to close it
  const popoverDialogRef = useRef(null);

  const handleClickOutside = (event) => {
    if (
      popoverDialogRef?.current &&
      !popoverDialogRef.current.contains(event.target)
    ) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Popover
      className="multichain-account-list-item-menu__popover"
      referenceElement={anchorElement}
      role={PopoverRole.Dialog}
      position={PopoverPosition.Bottom}
      offset={[0, 0]}
      padding={0}
      isOpen={isOpen}
      isPortal
      preventOverflow
    >
      <ModalFocus restoreFocus initialFocusRef={anchorElement}>
        <div onKeyDown={handleKeyDown} ref={popoverDialogRef}>
          <MenuItem
            onClick={() => {
              blockExplorerLinkText.firstPart === 'addBlockExplorer'
                ? routeToAddBlockExplorerUrl()
                : openBlockExplorer();

              trackEvent({
                event: MetaMetricsEventName.BlockExplorerLinkClicked,
                category: MetaMetricsEventCategory.Accounts,
                properties: {
                  location: 'Account Options',
                  chain_id: chainId,
                },
              });
            }}
            subtitle={blockExplorerUrlSubTitle || null}
            iconName={IconName.Export}
            data-testid="account-list-menu-open-explorer"
          >
            <Text variant={TextVariant.bodySm}>{t('viewOnExplorer')}</Text>
          </MenuItem>
          <MenuItem
            ref={accountDetailsItemRef}
            onClick={() => {
              dispatch(setAccountDetailsAddress(identity.address));
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
            data-testid="account-list-menu-details"
          >
            <Text variant={TextVariant.bodySm}>{t('accountDetails')}</Text>
          </MenuItem>
          {isRemovable ? (
            <MenuItem
              ref={removeAccountItemRef}
              data-testid="account-list-menu-remove"
              onClick={() => {
                dispatch(
                  showModal({
                    name: 'CONFIRM_REMOVE_ACCOUNT',
                    identity,
                  }),
                );
                trackEvent({
                  event: MetaMetricsEventName.AccountRemoved,
                  category: MetaMetricsEventCategory.Accounts,
                  properties: {
                    account_hardware_type: deviceName,
                    chain_id: chainId,
                    account_type: accountType,
                  },
                });
                onClose();
                closeMenu?.();
              }}
              iconName={IconName.Trash}
            >
              <Text variant={TextVariant.bodySm}>{t('removeAccount')}</Text>
            </MenuItem>
          ) : null}
          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            isCustodial ? (
              <MenuItem
                ref={removeJWTItemRef}
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
                      selectedAddress: toChecksumHexAddress(identity.address),
                    }),
                  );
                  onClose();
                  closeMenu?.();
                }}
                iconName={IconName.Trash}
              >
                <Text variant={TextVariant.bodySm}>{t('removeJWT')}</Text>
              </MenuItem>
            ) : null
            ///: END:ONLY_INCLUDE_IN
          }
        </div>
      </ModalFocus>
    </Popover>
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
   * Represents if the menu is open or not
   *
   * @type {boolean}
   */
  isOpen: PropTypes.bool.isRequired,
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
