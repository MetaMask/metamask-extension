import React, { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../contexts/hardware-wallets';
import { HARDWARE_WALLET_REPAIR_WALLET_TYPE_PARAM } from '../../contexts/hardware-wallets/constants';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import {
  Header,
  Page,
  Content,
  Footer,
} from '../../components/multichain/pages/page';
import { MultichainMetaFoxLogo } from '../../components/multichain/app-header/multichain-meta-fox-logo';
import {
  ensureRepairDeviceReady,
  getInstructionSteps,
} from './hardware-wallet-repair-utils';

export const HardwareWalletRepair: React.FC = () => {
  const t = useI18nContext();
  const { search } = useLocation();
  const {
    ensureDeviceReady,
    setConnectionReady,
    requestHardwareWalletPermission,
  } = useHardwareWalletActions();
  const { walletType } = useHardwareWalletConfig();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeWalletType = useMemo(() => {
    const routeWalletTypeParam = new URLSearchParams(search).get(
      HARDWARE_WALLET_REPAIR_WALLET_TYPE_PARAM,
    );

    return Object.values(HardwareWalletType).includes(
      routeWalletTypeParam as HardwareWalletType,
    )
      ? (routeWalletTypeParam as HardwareWalletType)
      : null;
  }, [search]);

  const repairWalletType = routeWalletType ?? walletType;

  const steps = useMemo(
    () => getInstructionSteps(repairWalletType),
    [repairWalletType],
  );

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (repairWalletType) {
        const permissionGranted =
          await requestHardwareWalletPermission(repairWalletType);
        if (!permissionGranted) {
          setError(t('hardwareWalletRepairDeviceNotDetected'));
          return;
        }
      }

      const shouldUseRouteReadinessCheck =
        routeWalletType && routeWalletType !== walletType;
      const ready = shouldUseRouteReadinessCheck
        ? await ensureRepairDeviceReady(routeWalletType)
        : await ensureDeviceReady();
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
    repairWalletType,
    routeWalletType,
    t,
    walletType,
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
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={4}
              paddingTop={4}
            >
              <Icon name={IconName.CheckBold} size={IconSize.Xl} />
              <Text
                variant={TextVariant.HeadingSm}
                textAlign={TextAlign.Center}
              >
                {t('hardwareWalletRepairSuccessTitle')}
              </Text>
              <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
                {t('hardwareWalletRepairSuccessDescription')}
              </Text>
            </Box>
          ) : (
            <Box flexDirection={BoxFlexDirection.Column} gap={4} paddingTop={4}>
              <Text variant={TextVariant.HeadingSm}>
                {t('hardwareWalletRepairPermissionsTitle')}
              </Text>

              <Box
                backgroundColor={BoxBackgroundColor.BackgroundAlternative}
                padding={4}
                flexDirection={BoxFlexDirection.Column}
                gap={4}
                className="rounded-lg"
              >
                {steps.map((step, index) => (
                  <Box
                    key={step.titleKey}
                    flexDirection={BoxFlexDirection.Row}
                    gap={3}
                    alignItems={BoxAlignItems.Start}
                  >
                    <Box
                      alignItems={BoxAlignItems.Center}
                      justifyContent={BoxJustifyContent.Center}
                      className="flex shrink-0"
                    >
                      <Icon name={step.icon} size={IconSize.Lg} />
                    </Box>
                    <Box flexDirection={BoxFlexDirection.Column} gap={1}>
                      <Text
                        variant={TextVariant.BodyMd}
                        fontWeight={FontWeight.Bold}
                      >
                        {`${index + 1}. ${t(step.titleKey)}`}
                      </Text>
                      <Text variant={TextVariant.BodyMd}>
                        {t(step.descriptionKey)}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>

              {error && (
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.ErrorDefault}
                  textAlign={TextAlign.Center}
                >
                  {error}
                </Text>
              )}

              {isConnecting && (
                <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
                  {t('hardwareWalletRepairDetecting')}
                </Text>
              )}

              <Button
                variant={ButtonVariant.Primary}
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
                data-testid="hardware-wallet-repair-reconnect"
              >
                {t('connect')}
              </Button>
            </Box>
          )}
        </Content>
        {isSuccess && (
          <Footer>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleClose}
              className="w-full"
              data-testid="hardware-wallet-repair-close"
            >
              {t('close')}
            </Button>
          </Footer>
        )}
      </Page>
    </>
  );
};
