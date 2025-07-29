import React, { useState, useMemo, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { CaipChainId } from '@metamask/utils';
import {
  SolScope,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  BtcScope,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/keyring-api';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
  BannerAlert,
  BannerAlertSeverity,
  Modal,
  ModalOverlay,
} from '../../../components/component-library';
import { ModalContent } from '../../../components/component-library/modal-content/deprecated';
import {
  AlignItems,
  BlockSize,
  IconColor,
  Display,
  TextVariant,
  TextColor,
  TextAlign,
  JustifyContent,
  BackgroundColor,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import WalletDetailsAccountItem from '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import SRPQuiz from '../../../components/app/srp-quiz-modal';
import { WalletDetailsAccountTypeSelection } from '../../../components/multichain/multichain-accounts/wallet-details-account-type-selection';
import {
  setAccountDetailsAddress,
  addNewAccount,
} from '../../../store/actions';
import {
  ACCOUNT_DETAILS_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  EVM_WALLET_TYPE,
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';

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
  const seedPhraseBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const wallet = walletsWithAccounts[decodedId as AccountWalletId];
  const [accountBalances, setAccountBalances] = useState<AccountBalance>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize wallet snap clients
  const solanaClient = useMultichainWalletSnapClient(WalletClientType.Solana);
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const bitcoinClient = useMultichainWalletSnapClient(WalletClientType.Bitcoin);
  ///: END:ONLY_INCLUDE_IF

  const totalBalance = useMemo(
    () =>
      Object.values(accountBalances)
        .reduce<number>((sum, balance) => sum + Number(balance || 0), 0)
        .toString(),
    [accountBalances],
  );

  const handleBalanceUpdate = useCallback(
    (accountId: string, balance: string | number) => {
      setAccountBalances((prev) => ({
        ...prev,
        [accountId]: balance,
      }));
    },
    [],
  );

  const handleAccountClick = (account: { id: string; address: string }) => {
    dispatch(setAccountDetailsAddress(account.address));
    history.push(`${ACCOUNT_DETAILS_ROUTE}/${account.address}`);
  };

  const handleBack = () => {
    history.goBack();
  };

  if (!wallet) {
    return (
      <Page className="wallet-details-page">
        <Header
          textProps={{
            variant: TextVariant.headingSm,
          }}
          startAccessory={
            <ButtonIcon
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              onClick={handleBack}
            />
          }
        >
          {t('walletDetails')}
        </Header>
        <Content>
          <BannerAlert
            severity={BannerAlertSeverity.Danger}
            title={t('walletNotFoundTitle')}
          >
            {t('walletNotFoundDescription', [id])}
          </BannerAlert>
        </Content>
      </Page>
    );
  }

  const keyringId = wallet.id.split(':')[1];

  const isEntropyWallet = wallet.id.includes('entropy');
  const isFirstHdKeyring = hdKeyrings[0]?.metadata?.id === keyringId;
  const shouldShowBackupReminder = !seedPhraseBackedUp && isFirstHdKeyring;

  const groupKeys = Object.keys(wallet.groups || {});
  // For now it's just the default group, but in the future we will have multiple groups
  const firstGroup =
    groupKeys.length > 0 ? wallet.groups[groupKeys[0] as AccountGroupId] : null;
  const accounts = firstGroup?.accounts || [];

  const handleAddAccount = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateEthereumAccount = async (): Promise<boolean> => {
    trace({ name: TraceName.AddAccount });
    try {
      await dispatch(addNewAccount(keyringId, false));
      return true;
    } catch (error) {
      console.error('Error creating Ethereum account:', error);
      return false;
    } finally {
      endTrace({ name: TraceName.AddAccount });
    }
  };

  const handleCreateSnapAccount = async (
    clientType: WalletClientType,
    chainId: CaipChainId,
  ): Promise<boolean> => {
    trace({ name: TraceName.AddAccount });
    try {
      let client;

      if (clientType === WalletClientType.Solana) {
        client = solanaClient;
      }
      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
      else if (clientType === WalletClientType.Bitcoin) {
        client = bitcoinClient;
      }
      ///: END:ONLY_INCLUDE_IF
      else {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.error(`Unsupported client type: ${clientType}`);
        return false;
      }

      if (!client) {
        console.error(`Client not available for type: ${clientType}`);
        return false;
      }

      await client.createAccount(
        {
          scope: chainId,
          entropySource: keyringId,
        },
        {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        },
      );
      return true;
    } catch (error) {
      console.error(`Error creating ${clientType} account:`, error);
      return false;
    } finally {
      endTrace({ name: TraceName.AddAccount });
    }
  };

  const handleAccountTypeSelect = async (
    accountType: WalletClientType | typeof EVM_WALLET_TYPE,
  ) => {
    let success = false;

    if (accountType === EVM_WALLET_TYPE) {
      success = await handleCreateEthereumAccount();
    } else if (accountType === WalletClientType.Solana) {
      success = await handleCreateSnapAccount(
        WalletClientType.Solana,
        SolScope.Mainnet as CaipChainId,
      );
    }
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    else if (accountType === WalletClientType.Bitcoin) {
      success = await handleCreateSnapAccount(
        WalletClientType.Bitcoin,
        BtcScope.Mainnet as CaipChainId,
      );
    }
    ///: END:ONLY_INCLUDE_IF

    if (success) {
      handleCloseModal();
    }
  };

  const rowStylesProps = {
    display: Display.Flex,
    justifyContent: JustifyContent.spaceBetween,
    alignItems: AlignItems.center,
    backgroundColor: BackgroundColor.backgroundAlternative,
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
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
          />
        }
      >
        {t('walletDetails')}
      </Header>
      <Content>
        <Box marginBottom={4} className="wallet-details-page__rows-container">
          <Box
            className="wallet-details-page__row"
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
              {wallet.metadata.name}
            </Text>
          </Box>

          <Box
            className="wallet-details-page__row"
            padding={4}
            {...rowStylesProps}
          >
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
              padding={4}
              marginBottom={1}
              width={BlockSize.Full}
              textAlign={TextAlign.Left}
              {...rowStylesProps}
              as="button"
              onClick={() => {
                if (shouldShowBackupReminder) {
                  const backUpSRPRoute = `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`;
                  history.push(backUpSRPRoute);
                } else {
                  setSrpQuizModalVisible(true);
                }
              }}
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
                {...rowStylesProps}
              />
            ))}
            {isEntropyWallet ? (
              <Box
                className="wallet-details-page__row wallet-details-page__add-account-button"
                padding={4}
                width={BlockSize.Full}
                textAlign={TextAlign.Left}
                {...rowStylesProps}
                as="button"
                onClick={handleAddAccount}
              >
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  gap={3}
                >
                  <Icon
                    name={IconName.Add}
                    size={IconSize.Md}
                    color={IconColor.primaryDefault}
                  />
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    color={TextColor.primaryDefault}
                  >
                    {t('addAccount')}
                  </Text>
                </Box>
              </Box>
            ) : null}
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
      {isModalOpen && (
        <Modal isOpen onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent
            className="multichain-account-menu-popover"
            modalDialogProps={{
              className: 'multichain-account-menu-popover__dialog',
              padding: 0,
              display: Display.Flex,
              flexDirection: FlexDirection.Column,
            }}
          >
            <WalletDetailsAccountTypeSelection
              onAccountTypeSelect={handleAccountTypeSelect}
              onClose={handleCloseModal}
            />
          </ModalContent>
        </Modal>
      )}
    </Page>
  );
};

WalletDetails.propTypes = {};

export default WalletDetails;
