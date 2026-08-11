import React, { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { MultichainTriggeredAddressRowsList } from '../../multichain-accounts/multichain-address-rows-triggered-list';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setShowSupportDataConsentModal } from '../../../store/actions';
import { AccountPicker } from '../account-picker';
import { GlobalMenuDrawerWithList } from '../global-menu-drawer';
import { getIsDefaultAddressEnabled } from '../../../selectors';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  DISCOVER_SEARCH_ROUTE,
} from '../../../helpers/constants/routes';
import { transitionForward } from '../../ui/transition';
import VisitSupportDataConsentModal from '../../app/modals/visit-support-data-consent-modal';
import { getShowSupportDataConsentModal } from '../../../ducks/app/app';
import {
  getAccountListStats,
  getMultichainAccountGroupById,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { trace, TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { MultichainAccountNetworkGroupWithCopyIcon } from '../../multichain-accounts/multichain-account-network-group-with-copy-icon';
import { useDispatch } from '../../../store/hooks';
import { getIsDiscoverSearchEnabled } from '../../../selectors/multichain/feature-flags';

type AppHeaderUnlockedContentProps = {
  disableAccountPicker: boolean;
  menuRef: React.RefObject<HTMLButtonElement>;
};

export const AppHeaderUnlockedContent = ({
  disableAccountPicker,
  menuRef,
}: AppHeaderUnlockedContentProps) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  // Derive from URL so drawer state survives route changes (e.g. homepage mount) without render>close>render flash
  const accountOptionsMenuOpen = searchParams.get('drawerOpen') === 'true';
  const selectedMultichainAccountId = useSelector(getSelectedAccountGroup);
  const selectedMultichainAccount = useSelector((state) =>
    getMultichainAccountGroupById(state, selectedMultichainAccountId),
  );
  const accountListStats = useSelector(getAccountListStats);
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const isDiscoverSearchEnabled = useSelector(getIsDiscoverSearchEnabled);

  const accountName = selectedMultichainAccount?.metadata.name ?? '';

  const showSupportDataConsentModal = useSelector(
    getShowSupportDataConsentModal,
  );

  const closeAccountOptionsMenu = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete('drawerOpen');
      return prev;
    });
  }, [setSearchParams]);

  const handleMainMenuToggle = useCallback(() => {
    const isMenuOpen = !accountOptionsMenuOpen;
    if (isMenuOpen) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NavMainMenuOpened)
          .addCategory(MetaMetricsEventCategory.Navigation)
          .addProperties({
            location: 'Home',
          })
          .build(),
      );
    }

    setSearchParams((prev) => {
      if (isMenuOpen) {
        prev.set('drawerOpen', 'true');
      } else {
        prev.delete('drawerOpen');
      }
      return prev;
    });
  }, [accountOptionsMenuOpen, trackEvent, createEventBuilder, setSearchParams]);

  const handleOpenDiscoverSearch = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ExploreSearchInteracted)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          interaction_type: 'opened',
        })
        .build(),
    );
    transitionForward(() =>
      navigate(DISCOVER_SEARCH_ROUTE, {
        state: {
          globalMenuTransition: 'forward',
        },
      }),
    );
  }, [createEventBuilder, navigate, trackEvent]);

  const multichainAccountAppContent = useMemo(() => {
    return (
      <Box style={{ overflow: 'hidden' }}>
        {/* Prevent overflow of account picker by long account names */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          className="min-w-0"
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
              transitionForward(() => navigate(ACCOUNT_LIST_PAGE_ROUTE));
              trackEvent(
                createEventBuilder(MetaMetricsEventName.NavAccountMenuOpened)
                  .addCategory(MetaMetricsEventCategory.Navigation)
                  .addProperties({
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
                  })
                  .build(),
              );
            }}
            disabled={disableAccountPicker}
            paddingLeft={2}
            paddingRight={2}
          />
        </Box>
        {selectedMultichainAccountId && (
          <Box
            className="ml-2 mt-1 w-fit"
            data-testid="networks-subtitle-test-id"
          >
            <MultichainTriggeredAddressRowsList
              groupId={selectedMultichainAccountId}
              showAccountHeaderAndBalance={false}
              onViewAllClick={() => {
                trace({
                  name: TraceName.ShowAccountAddressList,
                  op: TraceOperation.AccountUi,
                });
              }}
              showDefaultAddressSection={isDefaultAddressEnabled}
            >
              <MultichainAccountNetworkGroupWithCopyIcon
                groupId={selectedMultichainAccountId}
              />
            </MultichainTriggeredAddressRowsList>
          </Box>
        )}
      </Box>
    );
  }, [
    accountName,
    disableAccountPicker,
    isDefaultAddressEnabled,
    selectedMultichainAccountId,
    navigate,
    trackEvent,
    createEventBuilder,
    accountListStats,
  ]);

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="min-w-0"
      >
        {multichainAccountAppContent}
      </Box>
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.End}
        className="ml-auto"
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.End}
          className="relative w-full"
          gap={2}
        >
          {!accountOptionsMenuOpen && (
            <Box onClick={handleMainMenuToggle}>
              <NotificationsTagCounter noLabel />
            </Box>
          )}
          {isDiscoverSearchEnabled && (
            <ButtonIcon
              iconName={IconName.Search}
              data-testid="discover-search-button"
              ariaLabel={t('searchTokens')}
              onClick={handleOpenDiscoverSearch}
              size={ButtonIconSize.Md}
            />
          )}
          <ButtonIcon
            ref={menuRef}
            iconName={IconName.Menu}
            data-testid="account-options-menu-button"
            ariaLabel={t('accountOptions')}
            onClick={handleMainMenuToggle}
            size={ButtonIconSize.Md}
          />
        </Box>
        <GlobalMenuDrawerWithList
          isOpen={accountOptionsMenuOpen}
          onClose={closeAccountOptionsMenu}
        />
        <VisitSupportDataConsentModal
          isOpen={showSupportDataConsentModal}
          onClose={() => dispatch(setShowSupportDataConsentModal(false))}
        />
      </Box>
    </>
  );
};
