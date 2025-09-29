import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import browser from 'webextension-polyfill';

import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setShowSupportDataConsentModal,
  toggleAccountMenu,
} from '../../../store/actions';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { AccountPicker } from '../account-picker';
import { GlobalMenu } from '../global-menu';
import {
  getSelectedInternalAccount,
  getOriginOfCurrentTab,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { shortenAddress } from '../../../helpers/utils/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  REVIEW_PERMISSIONS,
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import VisitSupportDataConsentModal from '../../app/modals/visit-support-data-consent-modal';
import {
  getShowSupportDataConsentModal,
  setShowCopyAddressToast,
} from '../../../ducks/app/app';
import { PreferredAvatar } from '../../app/preferred-avatar';
import { AccountIconTour } from '../../app/account-icon-tour/account-icon-tour';
import {
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
  getNetworkAddressCount,
} from '../../../selectors/multichain-accounts/account-tree';

type AppHeaderUnlockedContentProps = {
  disableAccountPicker: boolean;
  menuRef: React.RefObject<HTMLButtonElement>;
};

export const AppHeaderUnlockedContent = ({
  disableAccountPicker,
  menuRef,
}: AppHeaderUnlockedContentProps) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const origin = useSelector(getOriginOfCurrentTab);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const tourAnchorRef = useRef<HTMLDivElement>(null);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const selectedMultichainAccountId = useSelector(getSelectedAccountGroup);
  const selectedMultichainAccount = useSelector((state) =>
    getMultichainAccountGroupById(state, selectedMultichainAccountId),
  );
  const numberOfAccountsInGroup = useSelector((state) =>
    getNetworkAddressCount(state, selectedMultichainAccountId),
  );

  // Used for account picker
  const internalAccount = useSelector(getSelectedInternalAccount);
  const shortenedAddress =
    internalAccount &&
    shortenAddress(normalizeSafeAddress(internalAccount.address));
  const accountName = isMultichainAccountsState2Enabled
    ? selectedMultichainAccount.metadata.name
    : internalAccount.metadata.name;

  // During onboarding there is no selected internal account
  const currentAddress = internalAccount?.address;

  // Passing non-evm address to checksum function will throw an error
  const normalizedCurrentAddress = normalizeSafeAddress(currentAddress);
  const [copied, handleCopy, resetCopyState] = useCopyToClipboard(2000, {
    expireClipboard: false,
  });

  const showSupportDataConsentModal = useSelector(
    getShowSupportDataConsentModal,
  );

  // Reset copy state when a switching accounts
  useEffect(() => {
    if (normalizedCurrentAddress) {
      resetCopyState();
    }
  }, [normalizedCurrentAddress, resetCopyState]);

  useEffect(() => {
    if (copied) {
      dispatch(setShowCopyAddressToast(true));
    } else {
      dispatch(setShowCopyAddressToast(false));
    }
  }, [copied, dispatch]);

  const showConnectedStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  const handleMainMenuToggle = () => {
    setAccountOptionsMenuOpen((previous) => {
      const isMenuOpen = !previous;
      if (isMenuOpen) {
        trackEvent({
          event: MetaMetricsEventName.NavMainMenuOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            location: 'Home',
          },
        });
      }

      return isMenuOpen;
    });
  };

  const handleConnectionsRoute = () => {
    history.push(`${REVIEW_PERMISSIONS}/${encodeURIComponent(origin)}`);
  };

  const handleCopyClick = useCallback(() => {
    handleCopy(normalizedCurrentAddress);
  }, [handleCopy, normalizedCurrentAddress]);

  const CopyButton = useMemo(
    () => (
      <ButtonBase
        className="multichain-app-header__address-copy-button"
        onClick={handleCopyClick}
        size={ButtonBaseSize.Sm}
        backgroundColor={BackgroundColor.transparent}
        borderRadius={BorderRadius.LG}
        endIconName={copied ? IconName.CopySuccess : IconName.Copy}
        endIconProps={{
          color: IconColor.iconAlternative,
          size: IconSize.Sm,
        }}
        paddingLeft={2}
        paddingRight={2}
        ellipsis
        textProps={{
          display: Display.Flex,
          gap: 2,
          variant: TextVariant.bodyMdMedium,
        }}
        style={{ height: 'auto' }} // ButtonBase doesn't have auto size
        data-testid="app-header-copy-button"
      >
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodySmMedium}
          ellipsis
          as="span"
        >
          {shortenedAddress}
        </Text>
      </ButtonBase>
    ),
    [copied, handleCopyClick, shortenedAddress],
  );

  const handleNetworksClick = useCallback(() => {
    history.push(
      `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(selectedMultichainAccountId)}`,
    );
  }, [history, selectedMultichainAccountId]);

  const multichainAccountAppContent = useMemo(() => {
    const networksLabel =
      numberOfAccountsInGroup === 1
        ? t('networkAddress')
        : t('networkAddresses', [numberOfAccountsInGroup]);

    return (
      <Box style={{ overflow: 'hidden' }}>
        {/* Prevent overflow of account picker by long account names */}
        <Text
          as="div"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          ellipsis
        >
          <AccountPicker
            address={''} // No address shown in multichain mode
            name={accountName}
            showAvatarAccount={false}
            onClick={() => {
              history.push(ACCOUNT_LIST_PAGE_ROUTE);
              trackEvent({
                event: MetaMetricsEventName.NavAccountMenuOpened,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: 'Home',
                },
              });
            }}
            disabled={disableAccountPicker}
            paddingLeft={2}
            paddingRight={2}
          />
          <>{!isMultichainAccountsState2Enabled && CopyButton}</>
        </Text>
        <Text
          color={TextColor.textAlternative}
          variant={TextVariant.bodyXsMedium}
          onClick={handleNetworksClick}
          data-testid="networks-subtitle-test-id"
          className="networks-subtitle"
          paddingInline={2}
        >
          {networksLabel}
        </Text>
      </Box>
    );
  }, [
    CopyButton,
    accountName,
    disableAccountPicker,
    handleNetworksClick,
    history,
    isMultichainAccountsState2Enabled,
    numberOfAccountsInGroup,
    t,
    trackEvent,
  ]);

  // TODO: [Multichain-Accounts-MUL-849] Delete this method once multichain accounts is released
  const AppContent = useMemo(() => {
    const handleAccountMenuClick = () => {
      if (isMultichainAccountsState2Enabled) {
        history.push(ACCOUNT_LIST_PAGE_ROUTE);
      } else {
        dispatch(toggleAccountMenu());
      }
    };

    return (
      <>
        <div ref={tourAnchorRef} className="flex">
          <PreferredAvatar address={internalAccount.address} />
        </div>

        {internalAccount && (
          <Text
            as="div"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            ellipsis
          >
            <AccountPicker
              address={internalAccount.address}
              name={accountName}
              showAvatarAccount={false}
              onClick={() => {
                handleAccountMenuClick();

                trackEvent({
                  event: MetaMetricsEventName.NavAccountMenuOpened,
                  category: MetaMetricsEventCategory.Navigation,
                  properties: {
                    location: 'Home',
                  },
                });
              }}
              disabled={disableAccountPicker}
              paddingLeft={2}
              paddingRight={2}
            />
            <>{CopyButton}</>
          </Text>
        )}
      </>
    );
  }, [
    internalAccount,
    accountName,
    disableAccountPicker,
    CopyButton,
    isMultichainAccountsState2Enabled,
    history,
    dispatch,
    trackEvent,
  ]);

  return (
    <>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
        className="min-w-0"
      >
        {isMultichainAccountsState2Enabled
          ? multichainAccountAppContent
          : AppContent}
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexEnd}
        style={{ marginLeft: 'auto' }}
      >
        <Box display={Display.Flex} gap={3}>
          {showConnectedStatus && (
            <Box ref={menuRef} data-testid="connection-menu" margin="auto">
              <ConnectedStatusIndicator
                onClick={() => handleConnectionsRoute()}
              />
            </Box>
          )}{' '}
          <Box
            ref={menuRef}
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            width={BlockSize.Full}
            style={{ position: 'relative' }}
          >
            {!accountOptionsMenuOpen && (
              <Box onClick={handleMainMenuToggle}>
                <NotificationsTagCounter noLabel />
              </Box>
            )}
            <ButtonIcon
              iconName={IconName.Menu}
              data-testid="account-options-menu-button"
              ariaLabel={t('accountOptions')}
              onClick={handleMainMenuToggle}
              size={ButtonIconSize.Lg}
            />
          </Box>
        </Box>
        <GlobalMenu
          anchorElement={menuRef.current}
          isOpen={accountOptionsMenuOpen}
          closeMenu={() => {
            setAccountOptionsMenuOpen(false);
          }}
        />
        <VisitSupportDataConsentModal
          isOpen={showSupportDataConsentModal}
          onClose={() => dispatch(setShowSupportDataConsentModal(false))}
        />
      </Box>

      {!isMultichainAccountsState2Enabled && (
        <AccountIconTour anchorElement={tourAnchorRef.current} />
      )}
    </>
  );
};
