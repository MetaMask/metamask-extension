import React from 'react';
import {
  Box,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ToggleButton from '../../ui/toggle-button';
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
    <Box className="w-full">
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="notifications-settings-box w-full"
        gap={4}
      >
        {children}
        <Box
          data-testid={`${dataTestId}-toggle-box`}
          className="w-10 min-w-10 shrink-0"
        >
          {loading ? (
            <Box className="text-right">
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
        <Box paddingTop={2}>
          <Text color={TextColor.ErrorDefault}>
            {t('notificationsSettingsBoxError')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
