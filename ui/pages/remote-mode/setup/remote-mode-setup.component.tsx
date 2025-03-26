import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  Box,
  Button,
  ButtonVariant,
  Text,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import Spinner from '../../../components/ui/spinner';
import {
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
} from '../../../helpers/constants/design-system';
import Card from '../../../components/ui/card';
import { AccountPicker } from '../../../components/multichain/account-picker';
import { AccountListMenu } from '../../../components/multichain/account-list-menu';
import RemoteModeHardwareWalletConfirm from './remote-mode-hardware-wallet-confirm.component';

const TOTAL_STEPS = 3;

export default function RemoteModeSetup({
  accounts,
}: {
  accounts: InternalAccount[];
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  const history = useHistory();

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

  const onConfirm = async () => {
    setIsConfirmModalOpen(true);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {isModalOpen && (
              <AccountListMenu
                onClose={() => {
                  setIsModalOpen(false);
                }}
                showAccountCreation={false}
              />
            )}
            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box display={Display.Block} gap={4}>
                <Text>
                  Estimated changes{' '}
                  <Icon name={IconName.Info} size={IconSize.Sm} />
                </Text>
                <Text>
                  Authorize{' '}
                  <Text
                    fontWeight={FontWeight.Bold}
                    display={Display.InlineBlock}
                  >
                    Account 1
                  </Text>{' '}
                  to swap from your{' '}
                  <Text
                    fontWeight={FontWeight.Bold}
                    display={Display.InlineBlock}
                  >
                    Hardware Lockbox
                  </Text>{' '}
                  balance.
                </Text>
              </Box>
            </Card>
            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box>
                <Text>
                  Authorized account{' '}
                  <Icon name={IconName.Info} size={IconSize.Sm} />
                </Text>
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
                    // block={true}
                  />
                </Box>
                <Box
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  gap={2}
                >
                  <Text>Recipient</Text>
                  <Text>Hardware Lockbox</Text>
                </Box>
              </Box>
            </Card>
            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box>
                <Text>Allowances</Text>
              </Box>
            </Card>
          </>
        );
      case 2:
        return (
          <>
            <Text textAlign={TextAlign.Center} color={TextColor.textMuted}>
              Unlock new features and better transaction experience. Approval required for Remote Mode.
            </Text>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text>Interacting with <Icon name={IconName.Info} size={IconSize.Sm} /></Text>
                <Text>Smart account</Text>
              </Box>
            </Card>

            <Card backgroundColor={BackgroundColor.backgroundMuted}>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text paddingBottom={2}>Network fee <Icon name={IconName.Info} size={IconSize.Sm} /></Text>
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
                  <Text>Enable Remote Swaps</Text>
                  <Text color={TextColor.textMuted} variant={TextVariant.bodySm}>Permission from Hardware Lockbox</Text>
                </Box>
                <Text color={TextColor.infoDefault}>Edit</Text>
              </Box>
              <Box
                marginTop={2}
                marginBottom={2}
              >
                <span style={{
                  borderTop: '1px solid var(--color-border-default)',
                  width: '100%',
                }} />
              </Box>
              <Box
                display={Display.Flex}
                gap={2}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Box>
                  <Text>Update to smart account</Text>
                  <Text color={TextColor.textMuted} variant={TextVariant.bodySm}>Permission from Hardware Lockbox</Text>
                </Box>
                <Text color={TextColor.infoDefault}>Edit</Text>
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
    <div
      className="main-container"
      style={{ maxWidth: '100%', overflowX: 'hidden' }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={2}
        width={BlockSize.Full}
        style={{ maxWidth: '100%', position: 'relative' }}
      >
        <Box
          marginBottom={2}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
        >
          <Text
            textAlign={TextAlign.Center}
            variant={TextVariant.bodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.infoDefault}
            style={{
              backgroundColor: '#43AEFC26',
              padding: '4px 8px',
              borderRadius: '16px',
              display: 'inline-block',
            }}
          >
            Step {currentStep} of {TOTAL_STEPS}
          </Text>
        </Box>

        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
        >
          {currentStep === 1 && 'Enable Remote Swaps'}
          {currentStep === 2 && 'Use smart account?'}
          {currentStep === 3 && 'Confirm changes'}
        </Text>

        {renderStepContent()}

        <Box
          paddingTop={2}
          display={Display.Flex}
          gap={2}
          justifyContent={JustifyContent.center}
        >
          <Button
            variant={ButtonVariant.Secondary}
            disabled={loading}
            width={BlockSize.Half}
            onClick={handleBack}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={currentStep === 3 ? onConfirm : handleNext}
            disabled={loading}
            width={BlockSize.Half}
          >
            {currentStep === TOTAL_STEPS ? 'Confirm' : 'Next'}
          </Button>
        </Box>
        {loading && <Spinner />}
        <RemoteModeHardwareWalletConfirm
          visible={isConfirmModalOpen}
          onConfirm={onConfirm}
          onBack={() => {
            setIsConfirmModalOpen(false);
          }}
          onClose={() => {
            setIsConfirmModalOpen(false);
          }}
        />
      </Box>
    </div>
  );
}
