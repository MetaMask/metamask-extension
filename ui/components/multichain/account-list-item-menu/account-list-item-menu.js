import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
///: END:ONLY_INCLUDE_IF
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getHardwareWalletType,
  getAccountTypeForKeyring,
  getPinnedAccountsList,
  getHiddenAccountsList,
  getOriginOfCurrentTab,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getMetaMaskAccountsOrdered,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
///: END:ONLY_INCLUDE_IF
import { MenuItem } from '../../ui/menu';
import {
  Box,
  IconName,
  ModalFocus,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
} from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  addPermittedAccount,
  showModal,
  updateAccountsList,
  updateHiddenAccountsList,
} from '../../../store/actions';
import { Display, TextVariant } from '../../../helpers/constants/design-system';
import { formatAccountType } from '../../../helpers/utils/metrics';
import { AccountDetailsMenuItem, ViewExplorerMenuItem } from '..';

const METRICS_LOCATION = 'Account Options';

export const AccountListItemMenu = ({
  anchorElement,
  onClose,
  closeMenu,
  isRemovable,
  identity,
  isOpen,
  isPinned,
  isHidden,
  isConnected,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const chainId = useSelector(getCurrentChainId);

  const deviceName = useSelector(getHardwareWalletType);

  const { keyring } = identity.metadata;
  const accountType = formatAccountType(getAccountTypeForKeyring(keyring));

  const pinnedAccountList = useSelector(getPinnedAccountsList);
  const hiddenAccountList = useSelector(getHiddenAccountsList);
  const shouldRenderConnectAccount = process.env.MULTICHAIN && !isConnected;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const isCustodial = keyring?.type ? /Custody/u.test(keyring.type) : false;
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    removeJWTItemRef.current,
    removeAccountItemRef.current,
    accountDetailsItemRef.current,
  ]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Tab' && event.target === lastItemRef.current) {
        // If Tab is pressed at the last item to close popover and focus to next element in DOM
        onClose();
      }
    },
    [onClose],
  );

  // Handle click outside of the popover to close it
  const popoverDialogRef = useRef(null);

  const handleClickOutside = useCallback(
    (event) => {
      if (
        popoverDialogRef?.current &&
        !popoverDialogRef.current.contains(event.target)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handlePinning = (address) => {
    const updatedPinnedAccountList = [...pinnedAccountList, address];
    dispatch(updateAccountsList(updatedPinnedAccountList));
  };

  const handleUnpinning = (address) => {
    const updatedPinnedAccountList = pinnedAccountList.filter(
      (item) => item !== address,
    );
    dispatch(updateAccountsList(updatedPinnedAccountList));
  };

  const handleHidding = (address) => {
    const updatedHiddenAccountList = [...hiddenAccountList, address];
    if (pinnedAccountList.includes(address)) {
      handleUnpinning(address);
    }
    dispatch(updateHiddenAccountsList(updatedHiddenAccountList));
  };

  const handleUnhidding = (address) => {
    const updatedHiddenAccountList = hiddenAccountList.filter(
      (item) => item !== address,
    );
    dispatch(updateHiddenAccountsList(updatedHiddenAccountList));
  };

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);

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
      flip
    >
      <ModalFocus restoreFocus initialFocusRef={anchorElement}>
        <div onKeyDown={handleKeyDown} ref={popoverDialogRef}>
          {shouldRenderConnectAccount ? (
            <Box display={[Display.Flex, Display.None]}>
              <MenuItem
                data-testid="account-list-menu-connect-account"
                onClick={() => {
                  dispatch(
                    addPermittedAccount(activeTabOrigin, identity.address),
                  );
                  onClose();
                }}
                iconName={IconName.UserCircleLink}
              >
                <Text variant={TextVariant.bodySm}>{t('connectAccount')}</Text>
              </MenuItem>
            </Box>
          ) : null}
          <AccountDetailsMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            address={identity.address}
            textProps={{ variant: TextVariant.bodySm }}
          />
          <ViewExplorerMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            textProps={{ variant: TextVariant.bodySm }}
            address={identity.address}
          />
          {isHidden ? null : (
            <MenuItem
              data-testid="account-list-menu-pin"
              onClick={() => {
                isPinned
                  ? handleUnpinning(identity.address)
                  : handlePinning(identity.address);
                onClose();
              }}
              iconName={isPinned ? IconName.Unpin : IconName.Pin}
            >
              <Text variant={TextVariant.bodySm}>
                {isPinned ? t('unpin') : t('pinToTop')}
              </Text>
            </MenuItem>
          )}
          <MenuItem
            data-testid="account-list-menu-hide"
            onClick={() => {
              isHidden
                ? handleUnhidding(identity.address)
                : handleHidding(identity.address);
              onClose();
            }}
            iconName={isHidden ? IconName.Eye : IconName.EyeSlash}
          >
            <Text variant={TextVariant.bodySm}>
              {isHidden ? t('showAccount') : t('hideAccount')}
            </Text>
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
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            isCustodial ? (
              <MenuItem
                ref={removeJWTItemRef}
                data-testid="account-options-menu__remove-jwt"
                onClick={async () => {
                  const token = await dispatch(
                    mmiActions.getCustodianToken(identity.address),
                  );

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
            ///: END:ONLY_INCLUDE_IF
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
   * Represents if the account should be removable
   */
  isRemovable: PropTypes.bool.isRequired,
  /**
   * Represents pinned accounts
   */
  isPinned: PropTypes.bool,
  /**
   * Represents hidden accounts
   */
  isHidden: PropTypes.bool,
  /**
   * Represents connected status
   */
  isConnected: PropTypes.bool,
  /**
   * An account object that has name, address, and balance data
   */
  identity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      snap: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        enabled: PropTypes.bool,
      }),
      keyring: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
