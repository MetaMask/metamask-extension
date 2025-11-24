import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
} from '@metamask/account-api';
import classnames from 'classnames';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainAccountCell } from '../../../components/multichain-accounts/multichain-account-cell';
import { AddMultichainAccount } from '../../../components/multichain-accounts/add-multichain-account';
import { useWalletInfo } from '../../../hooks/multichain-accounts/useWalletInfo';
import { MultichainSrpBackup } from '../../../components/multichain-accounts/multichain-srp-backup';
import {
  useSingleWalletAccountsBalanceCallback,
  useSingleWalletDisplayBalance,
} from '../../../hooks/multichain-accounts/useWalletBalance';
import { getPreferences } from '../../../selectors';

type WalletDetailsPageProps = {
  params?: { id: string };
};

export const WalletDetailsPage = ({
  params: propsParams,
}: WalletDetailsPageProps = {}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hookParams = useParams();

  const { id } = propsParams || hookParams;
  const walletId = decodeURIComponent(id as string) as AccountWalletId;
  const walletsWithAccounts = useSelector(getWalletsWithAccounts);
  const wallet = walletsWithAccounts[walletId as AccountWalletId];
  const { multichainAccounts, keyringId, isSRPBackedUp } =
    useWalletInfo(walletId);

  const walletTotalBalance = useSingleWalletDisplayBalance(walletId);
  const walletAccountBalance = useSingleWalletAccountsBalanceCallback(walletId);
  const { privacyMode } = useSelector(getPreferences);

  useEffect(() => {
    if (!wallet) {
      navigate(ACCOUNT_LIST_PAGE_ROUTE);
    }
  }, [wallet, navigate]);

  const isEntropyWallet = wallet?.type === AccountWalletType.Entropy;
  const shouldShowBackupReminder = isSRPBackedUp === false;

  const rowStylesProps = {
    display: Display.Flex,
    justifyContent: JustifyContent.spaceBetween,
    alignItems: AlignItems.center,
    backgroundColor: BackgroundColor.backgroundMuted,
  };

  const handleBack = () => {
    navigate(PREVIOUS_ROUTE);
  };

  const multichainAccountCells = useMemo(
    () =>
      multichainAccounts.map((group) => (
        <MultichainAccountCell
          key={`multichain-account-cell-${group.id}`}
          accountId={group.id as AccountGroupId}
          accountName={group.metadata.name}
          balance={walletAccountBalance(group.id) ?? ''}
          disableHoverEffect={true}
          privacyMode={privacyMode}
        />
      )),
    [multichainAccounts, privacyMode, walletAccountBalance],
  );

  const walletDetailsTitle = useMemo(() => {
    return `${wallet?.metadata.name} / ${t('accounts')}`;
  }, [wallet?.metadata.name, t]);

  return (
    <Page className="multichain-wallet-details-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
            data-testid="back-button"
          />
        }
      >
        {walletDetailsTitle}
      </Header>
      <Content>
        <Box
          marginBottom={4}
          className="multichain-wallet-details-page__rows-container"
        >
          <Box
            className={classnames(
              'multichain-wallet-details-page__row',
              'multichain-wallet-details-page__row--first',
            )}
            padding={4}
            {...rowStylesProps}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('walletName')}
            </Text>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {wallet?.metadata.name}
            </Text>
          </Box>

          <Box
            className="multichain-wallet-details-page__row"
            padding={4}
            {...rowStylesProps}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('balance')}
            </Text>
            <SensitiveText
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
              isHidden={privacyMode}
              ellipsis
            >
              {walletTotalBalance ?? '$ n/a'}
            </SensitiveText>
          </Box>
          {isEntropyWallet ? (
            <MultichainSrpBackup
              className={classnames(
                'multichain-wallet-details-page__row',
                'multichain-wallet-details-page__row--last',
                'multichain-wallet-details-page__srp-button',
              )}
              shouldShowBackupReminder={shouldShowBackupReminder}
              keyringId={keyringId}
            />
          ) : null}
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          backgroundColor={BackgroundColor.backgroundMuted}
          borderRadius={BorderRadius.XL}
        >
          {multichainAccountCells}
          {isEntropyWallet && <AddMultichainAccount walletId={walletId} />}
        </Box>
      </Content>
    </Page>
  );
};
