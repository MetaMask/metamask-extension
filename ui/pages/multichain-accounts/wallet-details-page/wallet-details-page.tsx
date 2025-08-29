import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
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
import SRPQuiz from '../../../components/app/srp-quiz-modal';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainAccountCell } from '../../../components/multichain-accounts/multichain-account-cell';
import { AddMultichainAccount } from '../../../components/multichain-accounts/add-multichain-account';
import { useWalletInfo } from '../../../hooks/multichain-accounts/useWalletInfo';

export const WalletDetailsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { id } = useParams();
  const walletId = decodeURIComponent(id as string) as AccountWalletId;
  const walletsWithAccounts = useSelector(getWalletsWithAccounts);
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const wallet = walletsWithAccounts[walletId as AccountWalletId];
  const { multichainAccounts, keyringId, isSRPBackedUp } =
    useWalletInfo(walletId);

  useEffect(() => {
    if (!wallet) {
      history.push(ACCOUNT_LIST_PAGE_ROUTE);
    }
  }, [wallet, history]);

  const isEntropyWallet = wallet?.type === AccountWalletType.Entropy;
  const shouldShowBackupReminder = isSRPBackedUp === false;

  const rowStylesProps = {
    display: Display.Flex,
    justifyContent: JustifyContent.spaceBetween,
    alignItems: AlignItems.center,
    backgroundColor: BackgroundColor.backgroundMuted,
  };

  const handleBack = () => {
    history.goBack();
  };

  const handleSrpBackupClick = () => {
    if (shouldShowBackupReminder) {
      const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
      history.push(backUpSRPRoute);
    } else {
      setSrpQuizModalVisible(true);
    }
  };

  const multichainAccountCells = useMemo(
    () =>
      multichainAccounts.map((group) => (
        <MultichainAccountCell
          key={`multichain-account-cell-${group.id}`}
          accountId={group.id as AccountGroupId}
          accountName={group.metadata.name}
          balance="$ n/a"
          disableHoverEffect={true}
        />
      )),
    [multichainAccounts],
  );

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
        {t('walletDetails')}
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
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              $ n/a
            </Text>
          </Box>
          {isEntropyWallet ? (
            <Box
              className={classnames(
                'multichain-wallet-details-page__row',
                'multichain-wallet-details-page__row--last',
                'multichain-wallet-details-page__srp-button',
              )}
              padding={4}
              width={BlockSize.Full}
              textAlign={TextAlign.Left}
              {...rowStylesProps}
              as="button"
              onClick={handleSrpBackupClick}
            >
              <Box>
                <Text
                  variant={TextVariant.bodyMdMedium}
                  color={TextColor.textDefault}
                >
                  {t('secretRecoveryPhrase')}
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={2}
              >
                {shouldShowBackupReminder ? (
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    color={TextColor.errorDefault}
                  >
                    {t('backup')}
                  </Text>
                ) : null}
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Sm}
                  color={IconColor.iconAlternative}
                />
              </Box>
            </Box>
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
      {isEntropyWallet && srpQuizModalVisible && (
        <SRPQuiz
          keyringId={keyringId}
          isOpen={srpQuizModalVisible}
          onClose={() => setSrpQuizModalVisible(false)}
          closeAfterCompleting
        />
      )}
    </Page>
  );
};
