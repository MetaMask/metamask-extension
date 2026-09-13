import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { SensitiveClipboardState } from '../../../hooks/useSensitiveClipboard';

type SensitiveClipboardCleanupProps = {
  state: SensitiveClipboardState;
  onClear: () => void;
};

export function SensitiveClipboardCleanup({
  state,
  onClear,
}: SensitiveClipboardCleanupProps) {
  const t = useI18nContext();

  if (state === 'idle') {
    return null;
  }

  if (state === 'cleared') {
    return (
      <BannerAlert
        severity={BannerAlertSeverity.Success}
        data-testid="sensitive-clipboard-cleared"
      >
        <Text variant={TextVariant.BodySm}>{t('clipboardCleared')}</Text>
      </BannerAlert>
    );
  }

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Warning}
      data-testid="sensitive-clipboard-warning"
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text variant={TextVariant.BodySm}>
          {t('sensitiveClipboardWarning')}
        </Text>
        {state === 'error' ? (
          <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
            {t('clipboardClearFailed')}
          </Text>
        ) : null}
        <Button
          data-testid="clear-sensitive-clipboard"
          onClick={onClear}
          size={ButtonSize.Sm}
          variant={ButtonVariant.Secondary}
        >
          {t('clearClipboard')}
        </Button>
      </Box>
    </BannerAlert>
  );
}
