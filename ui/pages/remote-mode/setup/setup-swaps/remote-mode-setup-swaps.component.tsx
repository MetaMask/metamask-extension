import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { Hex } from '@metamask/utils';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  AvatarIcon,
  AvatarIconSize,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import { AccountListMenu } from '../../../../components/multichain/account-list-menu';
import { AccountPicker } from '../../../../components/multichain/account-picker';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../../components/multichain/pages/page';
import Card from '../../../../components/ui/card';
import Dropdown from '../../../../components/ui/dropdown';
import Tooltip from '../../../../components/ui/tooltip';
import UnitInput from '../../../../components/ui/unit-input';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

import {
  DEFAULT_ROUTE,
  REMOTE_ROUTE,
} from '../../../../helpers/constants/routes';
import { getIsRemoteModeEnabled } from '../../../../selectors/remote-mode';
import {
  BaseToTokenOption,
  REMOTE_MODES,
  SwapAllowance,
  TokenSymbol,
  ToTokenOption,
} from '../../../../../shared/lib/remote-mode';

import {
  RemoteModeHardwareWalletConfirm,
  RemoteModeSwapAllowanceCard,
  StepIndicator,
} from '../../components';

import { isRemoteModeSupported } from '../../../../helpers/utils/remote-mode';

import {
  getMetaMaskAccountsOrdered,
  getSelectedInternalAccount,
} from '../../../../selectors';
import { InternalAccountWithBalance } from '../../../../selectors/selectors.types';
import { useRemoteMode } from '../../hooks/useRemoteMode';

const TOTAL_STEPS = 2;

/**
 * A multi-step setup component for configuring swaps in remote mode
 * Allows users to:
 * - Select an account
 * - Configure swap allowances
 * - Review and confirm changes (including EOA upgrade)
 *
 * @returns The rendered component
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RemoteModeSetupSwaps() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [selectedFromToken, setSelectedFromToken] = useState<TokenSymbol>(
    TokenSymbol.USDC,
  );
  const [selectedToToken, setSelectedToToken] = useState<ToTokenOption>(
    BaseToTokenOption.AllowedOutcome,
  );
  const [dailyLimit, setDailyLimit] = useState<string>('');
  const [isAllowancesExpanded, setIsAllowancesExpanded] =
    useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] =
    useState<InternalAccount | null>(null);
  const [dailyLimitError, setDailyLimitError] = useState<boolean>(false);
  const [swapToError, setSwapToError] = useState<boolean>(false);

  const selectedHardwareAccount = useSelector(getSelectedInternalAccount);
  const authorizedAccounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );

  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isUpdate = params.get('update') === 'true';

  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);
  const { enableRemoteMode, updateRemoteMode, remoteModeConfig } =
    useRemoteMode({
      account: selectedHardwareAccount.address as Hex,
    });

  const [swapAllowance, setSwapAllowance] = useState<SwapAllowance[]>(
    remoteModeConfig?.swapAllowance?.allowances ?? [],
  );

  const isHardwareAccount = useMemo(() => {
    return isRemoteModeSupported(selectedHardwareAccount);
  }, [selectedHardwareAccount]);

  useEffect(() => {
    if (authorizedAccounts.length > 0) {
      setSelectedAccount(authorizedAccounts[0]);
    }
  }, [authorizedAccounts]);

  useEffect(() => {
    if (!isRemoteModeEnabled) {
      history.push(DEFAULT_ROUTE);
    }
  }, [isRemoteModeEnabled, history]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      history.goBack();
    }
  };

  const handleAddAllowance = () => {
    if (!dailyLimit || parseFloat(dailyLimit) <= 0) {
      setDailyLimitError(true);
      return;
    }

    if (selectedToToken === BaseToTokenOption.AllowedOutcome) {
      setSwapToError(true);
      return;
    }

    const newAllowance = {
      from: selectedFromToken,
      to: selectedToToken,
      amount: parseFloat(dailyLimit),
    };

    setSwapAllowance((prevAllowances) => {
      const existingAllowance = prevAllowances.find(
        (allowance) =>
          allowance.from === selectedFromToken &&
          allowance.to === selectedToToken,
      );

      if (existingAllowance) {
        return prevAllowances.map((allowance) =>
          allowance === existingAllowance
            ? { ...allowance, amount: parseFloat(dailyLimit) }
            : allowance,
        );
      }

      return [...prevAllowances, newAllowance];
    });

    setSelectedFromToken(TokenSymbol.USDC);
    setSelectedToToken(BaseToTokenOption.AllowedOutcome);
    setDailyLimit('');
    setDailyLimitError(false);
    setSwapToError(false);
  };

  const handleRemoveAllowance = (
    tokenSymbol: TokenSymbol,
    toToken: ToTokenOption,
  ) => {
    setSwapAllowance(
      swapAllowance.filter(
        (allowance) =>
          !(allowance.from === tokenSymbol && allowance.to === toToken),
      ),
    );
  };

  const handleShowConfirmation = async () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfigureRemoteSwaps = async () => {
    if (!selectedAccount) {
      return;
    }

    try {
      if (isUpdate) {
        await updateRemoteMode({
          selectedAccount: selectedHardwareAccount,
          authorizedAccount: selectedAccount,
          mode: REMOTE_MODES.SWAP,
          meta: JSON.stringify({ allowances: swapAllowance }),
        });
      } else {
        await enableRemoteMode({
          selectedAccount: selectedHardwareAccount,
          authorizedAccount: selectedAccount,
          mode: REMOTE_MODES.SWAP,
          meta: JSON.stringify({ allowances: swapAllowance }),
        });
        history.replace(REMOTE_ROUTE);
      }
    } catch (error) {
      // TODO: show error on UI
      console.error(error);
    }
  };

  const onCancel = () => {
    history.goBack();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box width={BlockSize.Full}>
            {isModalOpen && (
              <AccountListMenu
                onClose={() => setIsModalOpen(false)}
                showAccountCreation={false}
                accountListItemProps={{
                  onClick: (account: InternalAccount) => {
                    setSelectedAccount(account);
                    setIsModalOpen(false);
                  },
                }}
              />
            )}
            <Card
              backgroundColor={BackgroundColor.backgroundSection}
              marginBottom={4}
            >
              <Box>
                <Box display={Display.Flex} gap={2}>
                  <Text>Authorized account</Text>
                  <Tooltip
                    position="top"
                    title="Anyone with access to this account can swap with the allowances you grant below"
                    trigger="mouseenter"
                  >
                    <Icon name={IconName.Info} size={IconSize.Sm} />
                  </Tooltip>
                </Box>
                <Box
                  display={Display.Flex}
                  gap={2}
                  marginTop={2}
                  marginBottom={2}
                  padding={2}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  borderRadius={BorderRadius.LG}
                  borderColor={BorderColor.borderDefault}
                >
                  {selectedAccount && (
                    <AccountPicker
                      address={selectedAccount?.address}
                      name={selectedAccount?.metadata.name}
                      onClick={() => {
                        setIsModalOpen(true);
                      }}
                    />
                  )}
                </Box>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  gap={2}
                >
                  <Box display={Display.Flex} gap={2}>
                    <Text>Recipient</Text>
                    <Tooltip
                      position="top"
                      title="Swapped funds are always received in your hardware account."
                      trigger="mouseenter"
                    >
                      <Icon name={IconName.Info} size={IconSize.Sm} />
                    </Tooltip>
                  </Box>
                  <Box display={Display.Flex} gap={2}>
                    <AvatarAccount
                      variant={AvatarAccountVariant.Jazzicon}
                      address={selectedHardwareAccount.address}
                      size={AvatarAccountSize.Xs}
                      marginTop={1}
                    />
                    <Text>{selectedHardwareAccount.metadata.name}</Text>
                  </Box>
                </Box>
              </Box>
            </Card>
            <Card
              backgroundColor={BackgroundColor.backgroundSection}
              marginBottom={2}
            >
              <Box marginBottom={2}>
                <Text variant={TextVariant.headingSm}>Swap limit</Text>
              </Box>
              <Box marginTop={4} marginBottom={2}>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  gap={4}
                  width={BlockSize.Full}
                >
                  <Box
                    width={BlockSize.Half}
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    gap={2}
                  >
                    <Text>Swap from</Text>
                    <Dropdown
                      onChange={(value) =>
                        setSelectedFromToken(value as TokenSymbol)
                      }
                      options={Object.values(TokenSymbol).map((value) => ({
                        name: value,
                        value,
                      }))}
                      selectedOption={selectedFromToken}
                      title="Select token"
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Box width={BlockSize.Half}>
                    <Text>Daily limit</Text>
                    <UnitInput
                      value={dailyLimit}
                      onChange={(newDecimalValue: string) => {
                        setDailyLimit(newDecimalValue);
                        if (parseFloat(newDecimalValue) <= 0) {
                          setDailyLimitError(true);
                        } else {
                          setDailyLimitError(false);
                        }
                      }}
                      placeholder="Enter amount"
                      style={{
                        width: '100%',
                        borderRadius: BorderRadius.MD,
                        minHeight: '45px',
                        marginTop: '8px',
                      }}
                      error={dailyLimitError}
                    />
                  </Box>
                </Box>
                <Box
                  width={BlockSize.Full}
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  gap={2}
                  marginTop={2}
                  marginBottom={4}
                >
                  <Text>Swap to</Text>
                  <Dropdown
                    onChange={(value) =>
                      setSelectedToToken(value as ToTokenOption)
                    }
                    options={[
                      ...Object.values(BaseToTokenOption).map((value) => ({
                        name: value,
                        value,
                      })),
                      ...Object.values(TokenSymbol).map((value) => ({
                        name: value,
                        value,
                      })),
                    ]}
                    selectedOption={selectedToToken}
                    style={{
                      width: '100%',
                      borderColor: swapToError
                        ? 'var(--color-error-default)'
                        : undefined,
                    }}
                  />
                </Box>
                {selectedToToken === BaseToTokenOption.Any && (
                  <Text variant={TextVariant.bodySm} marginBottom={4}>
                    Tip: This is a higher risk option if your authorized account
                    is compromised.
                  </Text>
                )}
                <Button
                  width={BlockSize.Full}
                  size={ButtonSize.Lg}
                  onClick={handleAddAllowance}
                >
                  Add
                </Button>
              </Box>
              <Box backgroundColor={BackgroundColor.backgroundSection}>
                <Box marginTop={2}>
                  {swapAllowance.map((allowance) => (
                    <RemoteModeSwapAllowanceCard
                      key={`${allowance.from}-${allowance.to}`}
                      swapAllowance={allowance}
                      onRemove={() =>
                        handleRemoveAllowance(allowance.from, allowance.to)
                      }
                    />
                  ))}
                </Box>
              </Box>
            </Card>
            <Box marginTop={4} marginBottom={2}>
              <Text>Only for MetaMask Swaps</Text>
              <Text color={TextColor.textMuted}>
                The authorized account can only use these allowances for
                MetaMask Swaps, which includes MEV protection to help prevent
                front-running and sandwich attacks.
              </Text>
              <Text marginTop={2}>Slippage protection</Text>
              <Text color={TextColor.textMuted}>
                Swap quotes are only received from DEX aggregators that have
                slippage and price protections.
              </Text>
            </Box>
          </Box>
        );
      case 2:
        return (
          <>
            <Card
              backgroundColor={BackgroundColor.backgroundSection}
              marginTop={2}
              marginBottom={4}
            >
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box display={Display.Flex} gap={2}>
                  <AvatarIcon
                    iconName={IconName.Star}
                    size={AvatarIconSize.Lg}
                  />
                  <Box>
                    <Text>Switch to to smart account</Text>
                    <Text
                      color={TextColor.textMuted}
                      variant={TextVariant.bodySm}
                    >
                      Permission from {selectedHardwareAccount.metadata.name}
                    </Text>
                  </Box>
                </Box>
                <Text
                  color={TextColor.infoDefault}
                  onClick={() => {
                    setCurrentStep(2);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Edit
                </Text>
              </Box>
              <Box marginTop={2} marginBottom={2}>
                <span
                  style={{
                    borderTop: '1px solid var(--color-border-default)',
                    width: '100%',
                  }}
                />
              </Box>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box display={Display.Flex} gap={2}>
                  <AvatarIcon
                    iconName={IconName.SwapHorizontal}
                    size={AvatarIconSize.Lg}
                  />
                  <Box>
                    <Text>Set up Remote Swaps</Text>
                    <Text
                      color={TextColor.textMuted}
                      variant={TextVariant.bodySm}
                    >
                      Permission from {selectedHardwareAccount.metadata.name}
                    </Text>
                  </Box>
                </Box>
                <Text
                  color={TextColor.infoDefault}
                  onClick={() => {
                    setCurrentStep(1);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Edit
                </Text>
              </Box>
              <Box marginTop={4}>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  alignItems={AlignItems.center}
                  onClick={() => setIsAllowancesExpanded(!isAllowancesExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text color={TextColor.infoDefault}>
                    {swapAllowance.length} token
                    {swapAllowance.length === 1 ? '' : 's'} enabled
                  </Text>
                  <Text>
                    {isAllowancesExpanded ? (
                      <Icon name={IconName.ArrowUp} size={IconSize.Sm} />
                    ) : (
                      <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
                    )}
                  </Text>
                </Box>
                {isAllowancesExpanded && (
                  <Box marginTop={2}>
                    {swapAllowance.map((allowance) => (
                      <RemoteModeSwapAllowanceCard
                        key={allowance.from}
                        swapAllowance={allowance}
                        onRemove={() =>
                          handleRemoveAllowance(allowance.from, allowance.to)
                        }
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Page className="main-container" data-testid="remote-mode-setup-swaps">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={'back'}
            iconName={IconName.ArrowLeft}
            onClick={onCancel}
          />
        }
      >
        Remote mode
      </Header>
      <Content
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        paddingLeft={4}
        paddingRight={4}
        width={BlockSize.Full}
      >
        {!isHardwareAccount && (
          <BannerAlert severity={BannerAlertSeverity.Warning} marginBottom={2}>
            <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
              Select a hardware wallet
            </Text>
            <Text variant={TextVariant.bodyMd}>
              To continue, select your hardware wallet from the account menu.
            </Text>
          </BannerAlert>
        )}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
        >
          {currentStep === 1 && 'Set up Remote Swaps'}
          {currentStep === 2 && 'Review changes'}
        </Text>

        {renderStepContent()}

        <RemoteModeHardwareWalletConfirm
          visible={isConfirmModalOpen}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onConfirm={handleConfigureRemoteSwaps}
          onClose={() => {
            setIsConfirmModalOpen(false);
          }}
        />
      </Content>
      <Footer>
        <Button
          onClick={handleBack}
          variant={ButtonVariant.Secondary}
          width={BlockSize.Half}
          size={ButtonSize.Lg}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={currentStep === 2 ? handleShowConfirmation : handleNext}
          width={BlockSize.Half}
          size={ButtonSize.Lg}
          disabled={!isHardwareAccount || swapAllowance.length === 0}
        >
          {currentStep === TOTAL_STEPS ? 'Confirm' : 'Next'}
        </Button>
      </Footer>
    </Page>
  );
}
