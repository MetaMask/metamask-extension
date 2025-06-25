import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { Hex } from '@metamask/utils';
import { AssetType } from '@metamask/bridge-controller';
import {
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
import { InternalAccountWithBalance } from '../../../../selectors/selectors.types';
import {
  DailyAllowance,
  REMOTE_MODES,
  TOKEN_DETAILS,
  TokenInfo,
  NATIVE_ADDRESS,
} from '../../../../../shared/lib/remote-mode';

import { isRemoteModeSupported } from '../../../../helpers/utils/remote-mode';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import {
  getMetaMaskAccountsOrdered,
  getSelectedInternalAccount,
  getSelectedNetwork,
} from '../../../../selectors';
import {
  RemoteModeDailyAllowanceCard,
  RemoteModeHardwareWalletConfirm,
  StepIndicator,
} from '../../components';
import { useRemoteMode } from '../../hooks/useRemoteMode';

const TOTAL_STEPS = 2;
const DAILY_ETH_LIMIT = 10;

/**
 * A multi-step setup component for configuring daily allowances in remote mode
 * Allows users to:
 * - Select an account
 * - Configure daily token allowances
 * - Review and confirm changes (including EOA upgrade)
 *
 * @returns The rendered component
 */
export default function RemoteModeSetupDailyAllowance() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const [selectedAllowanceAddress, setSelectedAllowanceAddress] =
    useState<string>('');
  const [dailyLimit, setDailyLimit] = useState<string>('0');
  const [isAllowancesExpanded, setIsAllowancesExpanded] =
    useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] =
    useState<InternalAccount | null>(null);
  const [allowanceError, setAllowanceError] = useState<boolean>(false);

  const selectedHardwareAccount = useSelector(getSelectedInternalAccount);

  const isHardwareAccount = useMemo(() => {
    return isRemoteModeSupported(selectedHardwareAccount);
  }, [selectedHardwareAccount]);

  const { enableRemoteMode, updateRemoteMode, remoteModeConfig } =
    useRemoteMode({
      account: selectedHardwareAccount.address as Hex,
    });

  const [dailyAllowance, setDailyAllowance] = useState<DailyAllowance[]>(
    remoteModeConfig?.dailyAllowance?.allowances ?? [],
  );

  const selectedNetwork = useSelector(getSelectedNetwork);
  const authorizedAccounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );

  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isUpdate = params.get('update') === 'true';

  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  const { assetsWithBalance } = useMultichainBalances();

  const assets = useMemo(() => {
    return assetsWithBalance
      .filter(
        (asset) => asset.chainId === selectedNetwork.configuration.chainId,
      )
      .map((asset) => ({
        name: asset.symbol,
        value: asset.address,
      }));
  }, [assetsWithBalance, selectedNetwork.configuration.chainId]);

  const selectedAllowanceBalance = useMemo(() => {
    return (
      assetsWithBalance.find(
        (asset) => asset.address === selectedAllowanceAddress,
      )?.balance ?? '0'
    );
  }, [assetsWithBalance, selectedAllowanceAddress]);

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
      setAllowanceError(true);
      return;
    }

    const selectedAsset = assetsWithBalance.find(
      (asset) => asset.address === selectedAllowanceAddress,
    ) as TokenInfo;

    // TODO: handle error
    if (!selectedAsset) {
      return;
    }

    const newAllowance: DailyAllowance = {
      amount: parseFloat(dailyLimit),
      address:
        selectedAsset.type === AssetType.native
          ? NATIVE_ADDRESS
          : selectedAsset.address,
      image: TOKEN_DETAILS[selectedAsset.symbol].image,
      name: selectedAsset.name,
      symbol: selectedAsset.symbol,
      type: selectedAsset.type,
      decimals: selectedAsset.decimals,
    };

    setDailyAllowance((prevAllowances) => {
      const filteredAllowances = prevAllowances.filter(
        (allowance) => allowance.address !== selectedAllowanceAddress,
      );
      return [...filteredAllowances, newAllowance];
    });

    setSelectedAllowanceAddress('');
    setDailyLimit('');
    setAllowanceError(false);
  };

  const handleRemoveAllowance = (address: string) => {
    setDailyAllowance(
      dailyAllowance.filter((allowance) => allowance.address !== address),
    );
  };

  const handleShowConfirmation = async () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfigureDailyAllowance = async () => {
    if (!selectedAccount) {
      return;
    }

    try {
      if (isUpdate) {
        await updateRemoteMode({
          selectedAccount: selectedHardwareAccount,
          authorizedAccount: selectedAccount,
          mode: REMOTE_MODES.DAILY_ALLOWANCE,
          meta: JSON.stringify({ allowances: dailyAllowance }),
        });
      } else {
        await enableRemoteMode({
          selectedAccount: selectedHardwareAccount,
          authorizedAccount: selectedAccount,
          mode: REMOTE_MODES.DAILY_ALLOWANCE,
          meta: JSON.stringify({ allowances: dailyAllowance }),
        });

        // TODO: check better way to route to remote mode if upgrade is needed
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
                      address={selectedAccount.address}
                      name={selectedAccount.metadata.name}
                      onClick={() => {
                        setIsModalOpen(true);
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Card>
            <Card
              backgroundColor={BackgroundColor.backgroundSection}
              marginBottom={2}
            >
              <Box marginBottom={2}>
                <Text variant={TextVariant.headingMd}>Allowances</Text>
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
                    <Text>Token</Text>
                    <Dropdown
                      onChange={(value) => {
                        setSelectedAllowanceAddress(value);
                      }}
                      options={assets}
                      selectedOption={selectedAllowanceAddress}
                      title="Select token"
                      style={{ width: '100%' }}
                    />
                  </Box>
                  <Box width={BlockSize.Half}>
                    <Text>Daily limit</Text>
                    <UnitInput
                      value={dailyLimit}
                      onChange={(newDecimalValue: string) =>
                        setDailyLimit(newDecimalValue)
                      }
                      placeholder="Enter amount"
                      style={{ width: '100%' }}
                      error={allowanceError}
                    />
                  </Box>
                </Box>
                <Box marginTop={2} marginBottom={2}>
                  <Box
                    display={Display.Flex}
                    justifyContent={JustifyContent.flexEnd}
                    gap={4}
                    width={BlockSize.Full}
                    marginBottom={4}
                  >
                    <Box
                      width={BlockSize.Half}
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={2}
                    >
                      <Text>Balance: {selectedAllowanceBalance}</Text>
                    </Box>
                    <Box
                      width={BlockSize.Half}
                      display={Display.Flex}
                      justifyContent={JustifyContent.flexEnd}
                    >
                      <Text>Limit: {DAILY_ETH_LIMIT}</Text>
                    </Box>
                  </Box>
                </Box>
                <Button
                  width={BlockSize.Full}
                  size={ButtonSize.Lg}
                  onClick={handleAddAllowance}
                  disabled={selectedAllowanceBalance === '0'}
                >
                  Add
                </Button>
              </Box>
              <Box backgroundColor={BackgroundColor.backgroundSection}>
                <Box marginTop={2}>
                  {dailyAllowance.map((allowance) => (
                    <RemoteModeDailyAllowanceCard
                      key={allowance.symbol}
                      dailyAllowance={allowance}
                      onRemove={() => handleRemoveAllowance(allowance.address)}
                    />
                  ))}
                </Box>
              </Box>
            </Card>
          </Box>
        );
      case 2:
        return (
          <>
            <Card backgroundColor={BackgroundColor.backgroundSection}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box>
                  <Text>Enable Daily Allowances</Text>
                  <Text
                    color={TextColor.textMuted}
                    variant={TextVariant.bodySm}
                  >
                    Permission from {selectedHardwareAccount.metadata.name}
                  </Text>
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
                <Box>
                  <Text>Update to smart account</Text>
                  <Text
                    color={TextColor.textMuted}
                    variant={TextVariant.bodySm}
                  >
                    Permission from {selectedHardwareAccount.metadata.name}
                  </Text>
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
              <Box marginTop={4}>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  alignItems={AlignItems.center}
                  onClick={() => setIsAllowancesExpanded(!isAllowancesExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text color={TextColor.infoDefault}>
                    {dailyAllowance.length} token
                    {dailyAllowance.length === 1 ? '' : 's'} enabled
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
                    {dailyAllowance.map((allowance) => (
                      <RemoteModeDailyAllowanceCard
                        key={allowance.symbol}
                        dailyAllowance={allowance}
                        onRemove={() =>
                          handleRemoveAllowance(allowance.address)
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
          {currentStep === 1 && 'Set a withdrawl limit'}
          {currentStep === 2 && 'Review changes'}
        </Text>

        {renderStepContent()}

        <RemoteModeHardwareWalletConfirm
          visible={isConfirmModalOpen}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onConfirm={handleConfigureDailyAllowance}
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
          disabled={!isHardwareAccount || dailyAllowance.length === 0}
        >
          {currentStep === TOTAL_STEPS ? 'Confirm' : 'Next'}
        </Button>
      </Footer>
    </Page>
  );
}
