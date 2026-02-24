import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import browser from 'webextension-polyfill';

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  Box as BoxDeprecated,
  ButtonIcon,
  ButtonIconSize,
  IconName as IconNameDeprecated,
  Text,
} from '../../component-library';
import { MultichainHoveredAddressRowsList } from '../../multichain-accounts/multichain-address-rows-hovered-list';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setShowSupportDataConsentModal } from '../../../store/actions';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { AccountPicker } from '../account-picker';
import { GlobalMenuDrawerWithList } from '../global-menu-drawer';
import {
  getSelectedInternalAccount,
  getOriginOfCurrentTab,
  getShowDefaultAddress,
} from '../../../selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  REVIEW_PERMISSIONS,
} from '../../../helpers/constants/routes';
import VisitSupportDataConsentModal from '../../app/modals/visit-support-data-consent-modal';
import {
  getShowSupportDataConsentModal,
  setShowCopyAddressToast,
} from '../../../ducks/app/app';
import {
  getAccountListStats,
  getDefaultScopeAndAddressByAccountGroupId,
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { trace, TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { MultichainAccountNetworkGroupWithDefaultAddress } from '../../multichain-accounts/multichain-account-network-group-with-default-address';
import { MultichainAccountNetworkGroup } from '../../multichain-accounts/multichain-account-network-group';

type AppHeaderUnlockedContentProps = {
  disableAccountPicker: boolean;
  menuRef: React.RefObject<HTMLButtonElement>;
};

export const AppHeaderUnlockedContent = ({
  disableAccountPicker,
  menuRef,
}: AppHeaderUnlockedContentProps) => {
  const { trackEvent } = useContext(MetaMetricsContext);
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const origin = useSelector(getOriginOfCurrentTab);
  // Derive from URL so drawer state survives route changes (e.g. homepage mount) without render>close>render flash
  const accountOptionsMenuOpen = searchParams.get('drawerOpen') === 'true';
  const selectedMultichainAccountId = useSelector(getSelectedAccountGroup);
  const selectedMultichainAccount = useSelector((state) =>
    getMultichainAccountGroupById(state, selectedMultichainAccountId),
  );
  const accountListStats = useSelector(getAccountListStats);
  const showDefaultAddress = useSelector(getShowDefaultAddress);
  const { defaultAddress } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(
      state,
      selectedMultichainAccountId,
    ),
  );

  // Used for account picker
  const internalAccount = useSelector(getSelectedInternalAccount);
  const accountName = selectedMultichainAccount?.metadata.name ?? '';

  // During onboarding there is no selected internal account
  const currentAddress = internalAccount?.address;

  // Passing non-evm address to checksum function will throw an error
  const normalizedCurrentAddress = normalizeSafeAddress(currentAddress);

  // useCopyToClipboard analysis: Copies a public address
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copied, _, resetCopyState] = useCopyToClipboard({
    clearDelayMs: null,
  });

  const showSupportDataConsentModal = useSelector(
    getShowSupportDataConsentModal,
  );

  const closeAccountOptionsMenu = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('drawerOpen');
      return prev;
    });
  }, [setSearchParams]);

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
    (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) &&
    origin !== browser.runtime.id;

  const handleMainMenuToggle = useCallback(() => {
    const isMenuOpen = !accountOptionsMenuOpen;
    if (isMenuOpen) {
      trackEvent({
        event: MetaMetricsEventName.NavMainMenuOpened,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          location: 'Home',
        },
      });
    }

    setSearchParams((prev) => {
      if (isMenuOpen) {
        prev.set('drawerOpen', 'true');
      } else {
        prev.delete('drawerOpen');
      }
      return prev;
    });
  }, [accountOptionsMenuOpen, trackEvent, setSearchParams]);

  const handleConnectionsRoute = () => {
    navigate(`${REVIEW_PERMISSIONS}/${encodeURIComponent(origin)}`);
  };

  const multichainAccountAppContent = useMemo(() => {
    return (
      <BoxDeprecated style={{ overflow: 'hidden' }}>
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
              trace({
                name: TraceName.ShowAccountList,
                op: TraceOperation.AccountUi,
              });
              navigate(ACCOUNT_LIST_PAGE_ROUTE);
              trackEvent({
                event: MetaMetricsEventName.NavAccountMenuOpened,
                category: MetaMetricsEventCategory.Navigation,
                properties: {
                  location: 'Home',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  pinned_count: accountListStats.pinnedCount,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  hidden_count: accountListStats.hiddenCount,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  total_accounts: accountListStats.totalAccounts,
                },
              });
            }}
            disabled={disableAccountPicker}
            paddingLeft={2}
            paddingRight={2}
          />
        </Text>
        {selectedMultichainAccountId && (
          <BoxDeprecated
            marginTop={1}
            marginLeft={2}
            style={{ width: 'fit-content' }}
            data-testid="networks-subtitle-test-id"
          >
            <MultichainHoveredAddressRowsList
              groupId={selectedMultichainAccountId}
              showAccountHeaderAndBalance={false}
              onViewAllClick={() => {
                trace({
                  name: TraceName.ShowAccountAddressList,
                  op: TraceOperation.AccountUi,
                });
              }}
            >
              {showDefaultAddress && defaultAddress ? (
                <MultichainAccountNetworkGroupWithDefaultAddress
                  groupId={selectedMultichainAccountId}
                />
              ) : (
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  backgroundColor={BoxBackgroundColor.BackgroundMuted}
                  padding={1}
                  gap={1}
                  className="rounded-lg"
                >
                  <MultichainAccountNetworkGroup
                    groupId={selectedMultichainAccountId}
                    limit={4}
                  />
                  <Icon
                    name={IconName.Copy}
                    size={IconSize.Sm}
                    color={IconColor.IconAlternative}
                  />
                </Box>
              )}
            </MultichainHoveredAddressRowsList>
          </BoxDeprecated>
        )}
      </BoxDeprecated>
    );
  }, [
    accountName,
    defaultAddress,
    disableAccountPicker,
    selectedMultichainAccountId,
    showDefaultAddress,
    navigate,
    trackEvent,
    accountListStats,
  ]);

  return (
    <>
      <BoxDeprecated
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
        className="min-w-0"
      >
        {multichainAccountAppContent}
      </BoxDeprecated>
      <BoxDeprecated
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexEnd}
        style={{ marginLeft: 'auto' }}
      >
        <BoxDeprecated display={Display.Flex} gap={2}>
          {showConnectedStatus && (
            <BoxDeprecated data-testid="connection-menu" margin="auto">
              <ConnectedStatusIndicator
                onClick={() => handleConnectionsRoute()}
              />
            </BoxDeprecated>
          )}{' '}
          <BoxDeprecated
            display={Display.Flex}
            justifyContent={JustifyContent.flexEnd}
            width={BlockSize.Full}
            style={{ position: 'relative' }}
          >
            {!accountOptionsMenuOpen && (
              <BoxDeprecated onClick={handleMainMenuToggle}>
                <NotificationsTagCounter noLabel />
              </BoxDeprecated>
            )}
            <ButtonIcon
              ref={menuRef}
              iconName={IconNameDeprecated.Menu}
              data-testid="account-options-menu-button"
              ariaLabel={t('accountOptions')}
              onClick={handleMainMenuToggle}
              size={ButtonIconSize.Lg}
            />
          </BoxDeprecated>
        </BoxDeprecated>
        <GlobalMenuDrawerWithList
          anchorElement={menuRef.current}
          isOpen={accountOptionsMenuOpen}
          onClose={closeAccountOptionsMenu}
        />
        <VisitSupportDataConsentModal
          isOpen={showSupportDataConsentModal}
          onClose={() => dispatch(setShowSupportDataConsentModal(false))}
        />
      </BoxDeprecated>
    </>
  );
};
