import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MultichainAccountList } from '../../multichain-accounts/multichain-account-list';
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

// The "Accounts" section of the side navigation: a header with manage/add
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
      <ScrollContainer className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <MultichainAccountList
          wallets={wallets}
          selectedAccountGroups={[selectedAccountGroup]}
          displayWalletHeader={hasMultipleWallets}
          showDefaultAddress={showDefaultAddress}
          shouldNavigateOnSelect={false}
        />
      </ScrollContainer>
    </section>
  );
};
