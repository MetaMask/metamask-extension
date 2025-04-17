import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Text } from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import {
  BlockSize,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextColor,
  TextAlign,
} from '../../../helpers/constants/design-system';
import Preloader from '../../ui/icon/preloader/preloader-icon.component';

export type NotificationsSettingsBoxProps = {
  children?: React.ReactNode;
  value: boolean;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  dataTestId: string;
  onToggle: () => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsSettingsBox({
  children,
  value,
  loading = false,
  disabled = false,
  error = null,
  dataTestId,
  onToggle,
}: NotificationsSettingsBoxProps) {
  const t = useI18nContext();

  return (
    <Box width={BlockSize.Full}>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
        gap={4}
        className="notifications-settings-box"
      >
        {children}
        <Box
          data-testid={`${dataTestId}-toggle-box`}
          className="notifications-settings-box__toggle"
        >
          {loading ? (
            <Box textAlign={TextAlign.Right}>
              <Preloader size={24} />
            </Box>
          ) : (
            <ToggleButton
              value={value}
              onToggle={onToggle}
              disabled={disabled}
              dataTestId={`${dataTestId}-toggle-input`}
              className="notifications-settings-box__toggle"
            />
          )}
        </Box>
      </Box>
      {error && (
        <Box paddingTop={0}>
          <Text as="p" color={TextColor.errorDefault} paddingTop={2}>
            {t('notificationsSettingsBoxError')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
