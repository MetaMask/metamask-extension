import React, { useCallback, useMemo, useState } from 'react';

import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  BlockSize,
  BorderRadius,
  Display,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../contexts/hardware-wallets';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import {
  Header,
  Page,
  Content,
  Footer,
} from '../../components/multichain/pages/page';
import { MultichainMetaFoxLogo } from '../../components/multichain/app-header/multichain-meta-fox-logo';

type InstructionStep = {
  icon: IconName;
  titleKey: string;
  descriptionKey: string;
};

const LEDGER_INSTRUCTIONS: InstructionStep[] = [
  {
    icon: IconName.Usb,
    titleKey: 'hardwareWalletRepairStepOneTitle',
    descriptionKey: 'hardwareWalletRepairStepOneDescription',
  },
  {
    icon: IconName.Lock,
    titleKey: 'hardwareWalletRepairStepTwoTitle',
    descriptionKey: 'hardwareWalletRepairStepTwoDescription',
  },
  {
    icon: IconName.Apps,
    titleKey: 'hardwareWalletRepairStepThreeTitle',
    descriptionKey: 'hardwareWalletRepairStepThreeDescription',
  },
];

const TREZOR_INSTRUCTIONS: InstructionStep[] = [
  {
    icon: IconName.Usb,
    titleKey: 'hardwareWalletRepairStepOneTitle',
    descriptionKey: 'hardwareWalletRepairStepOneDescription',
  },
  {
    icon: IconName.Lock,
    titleKey: 'hardwareWalletRepairStepTwoTitle',
    descriptionKey: 'hardwareWalletRepairStepTwoDescription',
  },
];

function getInstructionSteps(
  walletType: HardwareWalletType | null,
): InstructionStep[] {
  switch (walletType) {
    case HardwareWalletType.Trezor:
      return TREZOR_INSTRUCTIONS;
    case HardwareWalletType.Ledger:
    default:
      return LEDGER_INSTRUCTIONS;
  }
}

export const HardwareWalletRepair: React.FC = () => {
  const t = useI18nContext();
  const {
    ensureDeviceReady,
    setConnectionReady,
    requestHardwareWalletPermission,
  } = useHardwareWalletActions();
  const { walletType } = useHardwareWalletConfig();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => getInstructionSteps(walletType), [walletType]);

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (walletType) {
        const permissionGranted =
          await requestHardwareWalletPermission(walletType);
        if (!permissionGranted) {
          setError(t('hardwareWalletRepairDeviceNotDetected'));
          return;
        }
      }

      const ready = await ensureDeviceReady();
      if (ready) {
        setConnectionReady();
        setIsSuccess(true);
      } else {
        setError(t('hardwareWalletRepairDeviceNotDetected'));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('hardwareWalletRepairDeviceNotDetected');
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [
    ensureDeviceReady,
    setConnectionReady,
    requestHardwareWalletPermission,
    walletType,
    t,
  ]);

  return (
    <>
      <MultichainMetaFoxLogo />
      <Page data-testid="hardware-wallet-repair">
        <Header
          endAccessory={
            <ButtonIcon
              iconName={IconName.Close}
              ariaLabel={t('close')}
              size={ButtonIconSize.Md}
              onClick={handleClose}
              data-testid="hardware-wallet-repair-close-header"
            />
          }
        >
          {t('hardwareWalletRepairTitle')}
        </Header>
        <Content>
          {isSuccess ? (
            <Box
              display={Display.Flex}
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={4}
              paddingTop={4}
            >
              <Icon name={IconName.CheckBold} size={IconSize.Xl} />
              <Text
                variant={TextVariant.headingSm}
                textAlign={TextAlign.Center}
              >
                {t('hardwareWalletRepairSuccessTitle')}
              </Text>
              <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
                {t('hardwareWalletRepairSuccessDescription')}
              </Text>
            </Box>
          ) : (
            <Box
              display={Display.Flex}
              flexDirection={BoxFlexDirection.Column}
              gap={4}
              paddingTop={4}
            >
              <Text variant={TextVariant.headingSm}>
                {t('hardwareWalletRepairPermissionsTitle')}
              </Text>

              <Box
                backgroundColor={BoxBackgroundColor.BackgroundAlternative}
                borderRadius={BorderRadius.LG}
                padding={4}
                display={Display.Flex}
                flexDirection={BoxFlexDirection.Column}
                gap={4}
              >
                {steps.map((step, index) => (
                  <Box
                    key={step.titleKey}
                    display={Display.Flex}
                    flexDirection={BoxFlexDirection.Row}
                    gap={3}
                    alignItems={BoxAlignItems.Start}
                  >
                    <Box
                      display={Display.Flex}
                      alignItems={BoxAlignItems.Center}
                      justifyContent={BoxJustifyContent.Center}
                      style={{ flexShrink: 0 }}
                    >
                      <Icon name={step.icon} size={IconSize.Lg} />
                    </Box>
                    <Box
                      display={Display.Flex}
                      flexDirection={BoxFlexDirection.Column}
                      gap={1}
                    >
                      <Text variant={TextVariant.bodyMdBold}>
                        {`${index + 1}. ${t(step.titleKey)}`}
                      </Text>
                      <Text variant={TextVariant.bodyMd}>
                        {t(step.descriptionKey)}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>

              {error && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                  textAlign={TextAlign.Center}
                >
                  {error}
                </Text>
              )}

              {isConnecting && (
                <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
                  {t('hardwareWalletRepairDetecting')}
                </Text>
              )}

              <Button
                variant={ButtonVariant.Primary}
                onClick={handleConnect}
                disabled={isConnecting}
                width={BlockSize.Full}
                data-testid="hardware-wallet-repair-reconnect"
              >
                {t('hardwareWalletRepairConnectButton')}
              </Button>
            </Box>
          )}
        </Content>
        {isSuccess && (
          <Footer>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleClose}
              width={BlockSize.Full}
              data-testid="hardware-wallet-repair-close"
            >
              {t('hardwareWalletRepairCloseButton')}
            </Button>
          </Footer>
        )}
      </Page>
    </>
  );
};
