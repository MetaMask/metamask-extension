import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { SensitiveClipboardState } from '../../../hooks/useCopyToClipboard';

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
      <Box
        flexDirection={BoxFlexDirection.Row}
        className="w-full rounded-lg bg-success-muted px-3 py-2"
        data-testid="sensitive-clipboard-cleared"
        gap={2}
        onClick={(event) => event.stopPropagation()}
      >
        <Icon
          color={IconColor.SuccessDefault}
          name={IconName.CopySuccess}
          size={IconSize.Sm}
        />
        <Text color={TextColor.SuccessDefault} variant={TextVariant.BodySm}>
          {t('clipboardCleared')}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      className="w-full rounded-lg bg-warning-muted px-3 py-2"
      data-testid="sensitive-clipboard-warning"
      gap={2}
      onClick={(event) => event.stopPropagation()}
    >
      <Icon
        color={IconColor.WarningDefault}
        name={IconName.Warning}
        size={IconSize.Sm}
      />
      <Box className="min-w-0 flex-1" flexDirection={BoxFlexDirection.Column}>
        <Text color={TextColor.WarningDefault} variant={TextVariant.BodySm}>
          {t('sensitiveClipboardWarning')}
        </Text>
        {state === 'error' ? (
          <Text color={TextColor.ErrorDefault} variant={TextVariant.BodySm}>
            {t('clipboardClearFailed')}
          </Text>
        ) : null}
        <Button
          data-testid="clear-sensitive-clipboard"
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          size={ButtonSize.Sm}
          variant={ButtonVariant.Secondary}
        >
          {t('clearClipboard')}
        </Button>
      </Box>
    </Box>
  );
}
