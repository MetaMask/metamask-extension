import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainAccountList } from '../../multichain-accounts/multichain-account-list';
import { useAccountListSearch } from '../../multichain-accounts/hooks/useAccountListSearch';
import { ScrollContainer } from '../../../contexts/scroll-container';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { useAssetsUpdateAllAccountBalances } from '../../../hooks/useAssetsUpdateAllAccountBalances';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getShowDefaultAddressPreference } from '../../../selectors';
import {
  getAccountTree,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';

// The "Accounts" section of the side navigation: a header with search/manage/add
// actions above the account list, which scrolls independently of the page.
export const SideNavAccounts = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { wallets } = useSelector(getAccountTree);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const showDefaultAddress = useSelector(getShowDefaultAddressPreference);
  const { isAccountTreeSyncingInProgress } =
    useAccountsOperationsLoadingStates();

  useAssetsUpdateAllAccountBalances();

  const hasMultipleWallets = useMemo(
    () => Object.keys(wallets).length > 1,
    [wallets],
  );

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    searchPattern,
    onSearchBarChange,
    clearSearch,
    filteredWallets,
    hasFilteredWallets,
    isInSearchMode,
  } = useAccountListSearch(wallets);

  const handleSearchToggle = useCallback(() => {
    if (isSearchOpen) {
      clearSearch();
    }
    setIsSearchOpen((isOpen) => !isOpen);
  }, [clearSearch, isSearchOpen]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleSearchToggle();
      }
    },
    [handleSearchToggle],
  );

  const handleManageClick = useCallback(() => {
    navigate(ACCOUNT_LIST_PAGE_ROUTE);
  }, [navigate]);

  const handleAddClick = useCallback(() => {
    navigate(CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE);
  }, [navigate]);

  return (
    <section
      className="flex min-h-0 flex-1 flex-col border-t-2 border-border-muted"
      data-testid="side-nav-accounts"
    >
      <div className="flex items-center justify-between p-4">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {t('accounts')}
        </Text>
        <div className="flex items-center gap-1">
          <ButtonIcon
            iconName={IconName.Search}
            size={ButtonIconSize.Sm}
            ariaLabel={t('searchYourAccounts')}
            aria-pressed={isSearchOpen}
            onClick={handleSearchToggle}
            data-testid="side-nav-accounts-search-button"
          />
          <ButtonIcon
            iconName={IconName.Setting}
            size={ButtonIconSize.Sm}
            ariaLabel={t('manageAccounts')}
            onClick={handleManageClick}
            data-testid="side-nav-accounts-manage-button"
          />
          <ButtonIcon
            iconName={IconName.Add}
            size={ButtonIconSize.Sm}
            ariaLabel={t('addWallet')}
            onClick={handleAddClick}
            isDisabled={isAccountTreeSyncingInProgress}
            data-testid="side-nav-accounts-add-button"
          />
        </div>
      </div>
      {isSearchOpen && (
        <div className="px-4 pb-2">
          <TextFieldSearch
            autoFocus
            className="w-full"
            clearButtonOnClick={clearSearch}
            onChange={onSearchBarChange}
            placeholder={t('searchYourAccounts')}
            value={searchPattern}
            inputProps={
              {
                'data-testid': 'side-nav-accounts-search-input',
                onKeyDown: handleSearchKeyDown,
              } as React.ComponentPropsWithoutRef<'input'>
            }
          />
        </div>
      )}
      <ScrollContainer className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {hasFilteredWallets ? (
          <MultichainAccountList
            wallets={filteredWallets}
            selectedAccountGroups={[selectedAccountGroup]}
            isInSearchMode={isInSearchMode}
            displayWalletHeader={hasMultipleWallets}
            showDefaultAddress={showDefaultAddress}
            shouldNavigateOnSelect={false}
          />
        ) : (
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
            className="p-4 text-center"
            data-testid="side-nav-accounts-no-results"
          >
            {t('noAccountsFound')}
          </Text>
        )}
      </ScrollContainer>
    </section>
  );
};
