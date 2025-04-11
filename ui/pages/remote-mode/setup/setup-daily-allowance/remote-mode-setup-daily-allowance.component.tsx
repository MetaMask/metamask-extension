import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  Text,
  Icon,
  IconName,
  IconSize,
  Tag,
} from '../../../../components/component-library';
import Tooltip from '../../../../components/ui/tooltip';
import UnitInput from '../../../../components/ui/unit-input';
import Dropdown from '../../../../components/ui/dropdown';
import {
  AlignItems,
  FontWeight,
  TextVariant,
  TextAlign,
  BackgroundColor,
  Display,
  JustifyContent,
  FlexDirection,
  BlockSize,
  TextColor,
  BorderColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import Card from '../../../../components/ui/card';
import { AccountPicker } from '../../../../components/multichain/account-picker';
import { AccountListMenu } from '../../../../components/multichain/account-list-menu';
import { DailyAllowanceTokenTypes, DailyAllowance } from '../../remote.types';
import {
  DEFAULT_ROUTE,
  REMOTE_ROUTE,
} from '../../../../helpers/constants/routes';
import { getIsRemoteModeEnabled } from '../../../../selectors/remote-mode';
import RemoteModeHardwareWalletConfirm from '../hardware-wallet-confirm-modal';
import RemoteModeDailyAllowanceCard from '../daily-allowance-card';
import StepIndicator from '../step-indicator/step-indicator.component';

const TOTAL_STEPS = 3;

// example account
const account: InternalAccount = {
  address: '0x12C7e...q135f',
  type: 'eip155:eoa',
  id: '1',
  options: {},
  metadata: {
    name: 'Hardware Lockbox',
    importTime: 1717334400,
    keyring: {
      type: 'eip155',
    },
  },
  scopes: [],
  methods: [],
};

/**
 * A multi-step setup component for configuring daily allowances in remote mode
 * Allows users to:
 * - Select an account
 * - Configure daily token allowances
 * - Review and confirm changes (including EOA upgrade)
 *
 * @param props - Component props
 * @param [props.accounts] - List of available accounts, defaults to example account (which may not be needed)
 * @returns The rendered component
 */
export default function RemoteModeSetupDailyAllowance({
  accounts = [account],
}: {
  accounts?: InternalAccount[];
}) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [dailyAllowance, setDailyAllowance] = useState<DailyAllowance[]>([]);
  const [selectedAllowanceToken, setSelectedAllowanceToken] =
    useState<DailyAllowanceTokenTypes>(DailyAllowanceTokenTypes.ETH);
  const [dailyLimit, setDailyLimit] = useState<string>('');
  const [isAllowancesExpanded, setIsAllowancesExpanded] =
    useState<boolean>(false);

  const history = useHistory();

  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

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
    if (!dailyLimit) {
      return;
    }

    const newAllowance = {
      from: selectedAllowanceToken,
      amount: parseFloat(dailyLimit),
    };

    setDailyAllowance((prevAllowances) => {
      const filteredAllowances = prevAllowances.filter(
        (allowance) => allowance.tokenType !== selectedAllowanceToken,
      );
      return [
        ...filteredAllowances,
        { ...newAllowance, tokenType: selectedAllowanceToken },
      ];
    });

    setSelectedAllowanceToken(DailyAllowanceTokenTypes.ETH);
    setDailyLimit('');
  };

  const handleRemoveAllowance = (tokenSymbol: DailyAllowanceTokenTypes) => {
    setDailyAllowance(
      dailyAllowance.filter((allowance) => allowance.tokenType !== tokenSymbol),
    );
  };

  const handleShowConfirmation = async () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfigureRemoteSwaps = () => {
    history.replace(REMOTE_ROUTE);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box width={BlockSize.Full}>
            {isModalOpen && (
              <AccountListMenu
                onClose={() => {
                  setIsModalOpen(false);
                }}
                showAccountCreation={false}
              />
            )}
            <Card
              backgroundColor={BackgroundColor.backgroundMuted}
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
                  <AccountPicker
                    address="0x12C7e...q135f"
                    name="Account #1"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  />
                </Box>
              </Box>
            </Card>
            <Card
              backgroundColor={BackgroundColor.backgroundMuted}
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
                  marginBottom={4}
                >
                  <Box
                    width={BlockSize.Half}
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                    gap={2}
                  >
                    <Text>Token</Text>
                    <Dropdown
                      onChange={(value) =>
                        setSelectedAllowanceToken(
                          value as DailyAllowanceTokenTypes,
                        )
                      }
                      options={[
                        {
                          name: 'ETH',
                          value: 'ETH',
                        },
                      ]}
                      selectedOption={selectedAllowanceToken}
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
                    />
                  </Box>
                </Box>
                <Button
                  width={BlockSize.Full}
                  size={ButtonSize.Lg}
                  onClick={handleAddAllowance}
                >
                  Add
                </Button>
              </Box>
              <Box backgroundColor={BackgroundColor.backgroundMuted}>
                <Box marginTop={2}>
                  {dailyAllowance.map((allowance) => (
                    <RemoteModeDailyAllowanceCard
                      key={allowance.tokenType}
                      dailyAllowance={allowance}
                      onRemove={() =>
                        handleRemoveAllowance(allowance.tokenType)
                      }
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
            <Box
              marginTop={2}
              marginBottom={2}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              gap={2}
            >
              <Tag
                label="Includes 2 transactions"
                style={{ padding: '0 1rem' }}
              />
            </Box>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text>
                  Account type <Icon name={IconName.Info} size={IconSize.Sm} />
                </Text>
                <Text>Smart account</Text>
              </Box>
            </Card>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box>
                <Text>Estimated changes</Text>
                <Text>
                  Authorize Account 1 to swap from your{' '}
                  {accounts[0].metadata.name} balance.
                </Text>
              </Box>
            </Card>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text>Request from</Text>
                <Text>MetaMask</Text>
              </Box>
            </Card>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text paddingBottom={2}>
                  Network fee <Icon name={IconName.Info} size={IconSize.Sm} />
                </Text>
                <Text paddingBottom={2}>0.0013 ETH</Text>
              </Box>
              <Box
                paddingTop={2}
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text paddingBottom={2}>Speed</Text>
                <Text paddingBottom={2}>🦊 Market &lt; 30 sec</Text>
              </Box>
            </Card>
          </>
        );
      case 3:
        return (
          <>
            <Card backgroundColor={BackgroundColor.backgroundMuted}>
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
                    Permission from {accounts[0].metadata.name}
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
                    Permission from {accounts[0].metadata.name}
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
              <Box marginTop={2} marginBottom={2}>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  alignItems={AlignItems.center}
                  onClick={() => setIsAllowancesExpanded(!isAllowancesExpanded)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text>
                    {dailyAllowance.length} token
                    {dailyAllowance.length === 1 ? '' : 's'} enabled
                  </Text>
                  <Text color={TextColor.infoDefault}>
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
                        key={allowance.tokenType}
                        dailyAllowance={allowance}
                        onRemove={() =>
                          handleRemoveAllowance(allowance.tokenType)
                        }
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Card>
            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text paddingBottom={2}>Network fee</Text>
                <Text paddingBottom={2}>0.0013 ETH</Text>
              </Box>
              <Box
                paddingTop={2}
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text paddingBottom={2}>Speed</Text>
                <Text paddingBottom={2}>🦊 Market &lt; 30 sec</Text>
              </Box>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="main-container" data-testid="remote-mode-setup-swaps">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={2}
        width={BlockSize.Full}
      >
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
        >
          {currentStep === 1 && 'Enable Daily Allowances'}
          {currentStep === 2 && 'Transaction Request'}
          {currentStep === 3 && 'Review changes'}
        </Text>

        {renderStepContent()}

        <Box
          paddingTop={2}
          display={Display.Flex}
          gap={6}
          justifyContent={JustifyContent.center}
        >
          <Button
            onClick={handleBack}
            variant={ButtonVariant.Secondary}
            width={BlockSize.Half}
            size={ButtonSize.Lg}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={currentStep === 3 ? handleShowConfirmation : handleNext}
            width={BlockSize.Half}
            size={ButtonSize.Lg}
          >
            {currentStep === TOTAL_STEPS ? 'Confirm' : 'Next'}
          </Button>
        </Box>
        <RemoteModeHardwareWalletConfirm
          visible={isConfirmModalOpen}
          onConfirm={handleConfigureRemoteSwaps}
          onClose={() => {
            setIsConfirmModalOpen(false);
          }}
        />
      </Box>
    </div>
  );
}
