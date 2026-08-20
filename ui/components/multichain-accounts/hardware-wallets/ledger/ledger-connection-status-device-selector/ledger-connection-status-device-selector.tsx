import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import type { LedgerConnectionStatusDeviceSelectorProps } from './ledger-connection-status-device-selector.types';

/**
 * Renders the detected Ledger device model for the device-found state.
 * @param props - Component props.
 * @param props.deviceModelName - Detected Ledger model name.
 * @param props.deviceCount - Number of detected devices. Selection indicator shows when greater than 1.
 * @param props.isDeviceSelectionEnabled - Enables row click when multiple devices are detected.
 * @param props.onDeviceSelectorClick - Row click handler when device selection is enabled.
 */
export const LedgerConnectionStatusDeviceSelector = ({
  deviceModelName,
  deviceCount = 1,
  isDeviceSelectionEnabled = false,
  onDeviceSelectorClick,
}: Readonly<LedgerConnectionStatusDeviceSelectorProps>) => {
  const showSelectionIndicator = deviceCount > 1;
  const isClickable =
    isDeviceSelectionEnabled &&
    showSelectionIndicator &&
    Boolean(onDeviceSelectorClick);

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      padding={3}
      className={`rounded-xl w-full max-w-[20rem]${isClickable ? ' cursor-pointer' : ''}`}
      data-testid="ledger-connection-status-device-selector"
      {...(isClickable ? { onClick: onDeviceSelectorClick } : {})}
    >
      <Icon name={IconName.Mobile} size={IconSize.Md} />
      <Text variant={TextVariant.BodyMd} className="flex-1">
        {deviceModelName}
      </Text>
      {showSelectionIndicator ? (
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Lg}
          data-testid="ledger-connection-status-device-selector-indicator"
        />
      ) : null}
    </Box>
  );
};

export default LedgerConnectionStatusDeviceSelector;
