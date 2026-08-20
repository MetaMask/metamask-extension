import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { LedgerConnectionStatusDeviceSelector } from '../ledger-connection-status-device-selector';
import { LedgerConnectionStatusIllustration } from '../ledger-connection-status-illustration';
import { LedgerConnectionStatusInstructions } from '../ledger-connection-status-instructions';
import {
  LEDGER_CONNECTION_STATUS,
  LEDGER_CONNECTION_STATUS_CONTENT,
} from '../ledger-connection-status.constants';
import type { LedgerConnectionStatusProps } from './ledger-connection-status.types';

/**
 * Displays the Ledger hardware wallet connection state UI.
 * @param props - Component props.
 * @param props.status - Connection state for the illustration, copy, and optional sections.
 * @param props.deviceModelName - Ledger model name when status is device-found.
 * @param props.deviceCount - Number of detected Ledger devices for the device-found state.
 * @param props.isDeviceSelectionEnabled - Enables device selection when multiple devices are detected.
 * @param props.onBack - Back button click handler. Omit to hide the back button.
 * @param props.onDeviceSelectorClick - Device selector click handler when device selection is enabled.
 */
export const LedgerConnectionStatus = ({
  status,
  deviceModelName,
  deviceCount,
  isDeviceSelectionEnabled,
  onBack,
  onDeviceSelectorClick,
}: Readonly<LedgerConnectionStatusProps>) => {
  const t = useI18nContext();
  const contentConfig = LEDGER_CONNECTION_STATUS_CONTENT[status];
  const title = t(contentConfig.titleKey);
  const description = contentConfig.descriptionKey
    ? t(contentConfig.descriptionKey)
    : undefined;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="h-full w-full"
      data-testid={`ledger-connection-status-${status}`}
    >
      {onBack ? (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          paddingTop={4}
          paddingBottom={4}
          paddingLeft={3}
          paddingRight={2}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            onClick={onBack}
            data-testid="ledger-connection-status-back"
          />
        </Box>
      ) : null}

      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        gap={4}
        className="w-full flex-1"
      >
        <LedgerConnectionStatusIllustration status={status} />

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
          className="w-full"
        >
          <Text
            variant={TextVariant.HeadingLg}
            textAlign={TextAlign.Center}
            data-testid="ledger-connection-status-title"
          >
            {title}
          </Text>

          {description ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
              data-testid="ledger-connection-status-description"
            >
              {description}
            </Text>
          ) : null}
        </Box>

        {contentConfig.showDeviceSelector && deviceModelName ? (
          <LedgerConnectionStatusDeviceSelector
            deviceModelName={deviceModelName}
            deviceCount={deviceCount}
            isDeviceSelectionEnabled={isDeviceSelectionEnabled}
            onDeviceSelectorClick={onDeviceSelectorClick}
          />
        ) : null}

        {status === LEDGER_CONNECTION_STATUS.DeviceNotFound ? (
          <LedgerConnectionStatusInstructions
            status={LEDGER_CONNECTION_STATUS.DeviceNotFound}
          />
        ) : null}
      </Box>
    </Box>
  );
};

export default LedgerConnectionStatus;
