import React, { useMemo } from 'react';
import type { AllWalletsBalance } from '@metamask/assets-controllers';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import { getAccountTree } from '../../../selectors/multichain-accounts/account-tree';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors/multichain-accounts/feature-flags';
import { selectBalanceForAllWallets } from '../../../selectors/assets';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { formatWithThreshold } from '../../../components/app/assets/util/formatWithThreshold';

export const AccountList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const { selectedAccountGroup } = accountTree;

  const isState2Enabled = useSelector(getIsMultichainAccountsState2Enabled);
  const allBalances = useSelector(selectBalanceForAllWallets) as
    | AllWalletsBalance
    | undefined;
  const locale = useSelector(getIntlLocale);
  const fallbackCurrency = useSelector(getCurrentCurrency);

  const formattedAccountGroupBalancesByWallet = useMemo(() => {
    if (!isState2Enabled || !allBalances) {
      return undefined;
    }
    const result: Record<string, Record<string, string>> = {};
    const currency = allBalances.userCurrency || fallbackCurrency;
    Object.entries(wallets || {}).forEach(([walletId, walletData]) => {
      Object.keys(walletData.groups || {}).forEach((groupId) => {
        const amount =
          allBalances.wallets?.[walletId]?.groups?.[groupId]
            ?.totalBalanceInUserCurrency;
        if (typeof amount === 'number' && currency) {
          (result[walletId] ||= {})[groupId] = formatWithThreshold(
            amount,
            0.0,
            locale,
            {
              style: 'currency',
              currency: String(currency).toUpperCase(),
            },
          );
        }
      });
    });
    return result;
  }, [isState2Enabled, allBalances, wallets, locale, fallbackCurrency]);

  return (
    <Page className="account-list-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
          />
        }
      >
        {t('accounts')}
      </Header>
      <Content className="account-list-page__content">
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <MultichainAccountList
            wallets={wallets}
            selectedAccountGroups={[selectedAccountGroup]}
            formattedAccountGroupBalancesByWallet={
              formattedAccountGroupBalancesByWallet
            }
          />
        </Box>
      </Content>
    </Page>
  );
};
