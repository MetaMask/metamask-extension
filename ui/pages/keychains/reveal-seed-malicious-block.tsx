import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  Icon,
  IconColor,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';

type RevealSeedMaliciousBlockProps = {
  onDismiss: () => void;
  hostname?: string;
};

export function RevealSeedMaliciousBlock({
  onDismiss,
  hostname,
}: Readonly<RevealSeedMaliciousBlockProps>) {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      gap={4}
      data-testid="reveal-seed-malicious-block"
      className="h-full w-full"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={4}
        className="w-full pt-10"
      >
        <Icon
          name={IconName.Danger}
          color={IconColor.ErrorDefault}
          aria-label={t('srpRevealMaliciousBlockIconAriaLabel')}
          data-testid="reveal-seed-malicious-block-icon"
          className="w-10 h-10"
        />
        <Text
          variant={TextVariant.DisplayMd}
          color={TextColor.TextDefault}
          textAlign={TextAlign.Center}
          data-testid="reveal-seed-malicious-block-heading"
        >
          {t('srpRevealMaliciousBlockHeading')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
          data-testid="reveal-seed-malicious-block-body"
        >
          {t('srpRevealMaliciousBlockBody', [
            <strong key="hostname">{hostname ?? ''}</strong>,
          ])}
        </Text>
      </Box>
      <Box className="w-full mt-auto cta-footer">
        <Button
          size={ButtonSize.Lg}
          onClick={onDismiss}
          data-testid="reveal-seed-malicious-block-dismiss"
          className="w-full"
        >
          {t('srpRevealMaliciousBlockDismiss')}
        </Button>
      </Box>
    </Box>
  );
}
