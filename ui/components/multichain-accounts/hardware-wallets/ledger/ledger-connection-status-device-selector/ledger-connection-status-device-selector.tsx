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
 * Shows the detected Ledger device model in the device-found connection state.
 * @param options0
 * @param options0.deviceModelName
 * @param options0.onDeviceSelectorClick
 */
export const LedgerConnectionStatusDeviceSelector = ({
  deviceModelName,
  onDeviceSelectorClick,
}: Readonly<LedgerConnectionStatusDeviceSelectorProps>) => {
  const content = (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      padding={3}
      className="rounded-xl w-full max-w-[20rem]"
      data-testid="ledger-connection-status-device-selector"
    >
      <Icon name={IconName.Mobile} size={IconSize.Md} />
      <Text variant={TextVariant.BodyMd} className="flex-1">
        {deviceModelName}
      </Text>
      <Icon name={IconName.ArrowRight} size={IconSize.Lg} />
    </Box>
  );

  if (!onDeviceSelectorClick) {
    return content;
  }

  return (
    <button
      type="button"
      className="w-full max-w-[20rem] border-none bg-transparent p-0 text-left"
      onClick={onDeviceSelectorClick}
      data-testid="ledger-connection-status-device-selector-button"
    >
      {content}
    </button>
  );
};

export default LedgerConnectionStatusDeviceSelector;
