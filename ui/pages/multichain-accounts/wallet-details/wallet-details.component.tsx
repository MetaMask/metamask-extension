import React, { useState, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
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
  IconColor,
  Display,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import WalletDetailsAccountItem from '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import SRPQuiz from '../../../components/app/srp-quiz-modal';
import { setAccountDetailsAddress } from '../../../store/actions';

type AccountBalance = {
  [key: string]: string | number;
};

const WalletDetails = () => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const { id } = useParams();
  const decodedId = decodeURIComponent(id as string);
  const walletsWithAccounts = useSelector(getWalletsWithAccounts);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const wallet = walletsWithAccounts[decodedId as AccountWalletId];
  if (!wallet) {
    throw new Error(`Wallet with ID "${id}" not found`);
  }
  const keyringId = wallet.id.split(':')[1];

  const isEntropyWallet = wallet.id.includes('entropy');
  const isFirstHdKeyring = hdKeyrings[0]?.metadata?.id === keyringId;
  const shouldShowBackupReminder =
    seedPhraseBackedUp === false && isFirstHdKeyring;

  const groupKeys = Object.keys(wallet.groups || {});
  // For now it's just the default group, but in the future we will have multiple groups
  const firstGroup =
    groupKeys.length > 0 ? wallet.groups[groupKeys[0] as AccountGroupId] : null;
  const accounts = firstGroup?.accounts || [];

  const [accountBalances, setAccountBalances] = useState<AccountBalance>({});

  const handleBalanceUpdate = (accountId: string, balance: string | number) => {
    setAccountBalances((prev) => ({
      ...prev,
      [accountId]: balance,
    }));
  };

  const totalBalance = useMemo(
    () =>
      Object.values(accountBalances)
        .reduce<number>((sum, balance) => sum + Number(balance || 0), 0)
        .toString(),
    [accountBalances],
  );

  const handleBack = () => {
    history.goBack();
  };

  const handleAccountClick = (account: { id: string; address: string }) => {
    dispatch(setAccountDetailsAddress(account.address));
  };

  return (
    <Page className="wallet-details-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
          />
        }
      >
        Wallet Details
      </Header>
      <Content>
        <Box marginBottom={4} className="wallet-details-page__rows-container">
          <Box className="wallet-details-page__row">
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
              {wallet.metadata.name}
            </Text>
          </Box>

          <Box className="wallet-details-page__row">
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('balance')}
            </Text>
            <UserPreferencedCurrencyDisplay
              value={totalBalance}
              type="PRIMARY"
              ethNumberOfDecimals={4}
              hideTitle
              showFiat
              isAggregatedFiatOverviewBalance
              hideLabel
              textProps={{
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
            />
          </Box>
        </Box>

        {isEntropyWallet ? (
          <Box marginBottom={4} className="wallet-details-page__rows-container">
            <Box
              className="wallet-details-page__row wallet-details-page__srp-button"
              as="button"
              onClick={() => setSrpQuizModalVisible(true)}
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
          </Box>
        ) : null}

        {accounts.length > 0 && (
          <Box className="wallet-details-page__rows-container">
            {accounts.map((account) => (
              <WalletDetailsAccountItem
                key={account.id}
                account={account}
                onClick={handleAccountClick}
                onBalanceUpdate={handleBalanceUpdate}
                className="wallet-details-page__row"
              />
            ))}
          </Box>
        )}
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

WalletDetails.propTypes = {};

export default WalletDetails;
