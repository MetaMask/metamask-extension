import React from 'react';
import { Box, BoxSpacing } from '@metamask/design-system-react';
import {
  SECURITY_PROVIDER_CONFIG,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import {
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const TEXT_ALIGN_CLASS: Partial<Record<TextAlign, string>> = {
  [TextAlign.Left]: 'text-left',
  [TextAlign.Center]: 'text-center',
  [TextAlign.Right]: 'text-right',
};

export type AlertProviderProps = {
  provider?: SecurityProvider;
  paddingTop?: BoxSpacing;
  textAlign?: TextAlign;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AlertProvider({
  provider,
  paddingTop = 0,
  textAlign,
}: AlertProviderProps) {
  const t = useI18nContext();

  if (!provider) {
    return null;
  }

  return (
    <Box
      paddingTop={paddingTop}
      className={textAlign ? TEXT_ALIGN_CLASS[textAlign] : undefined}
    >
      <Text
        marginTop={1}
        display={Display.InlineFlex}
        alignItems={AlignItems.center}
        color={TextColor.textAlternative}
        variant={TextVariant.bodySm}
      >
        <Icon
          color={IconColor.primaryDefault}
          name={IconName.SecurityTick}
          size={IconSize.Sm}
          marginInlineEnd={1}
        />
        {t('securityProviderPoweredBy', [
          <ButtonLink
            key={`security-provider-button-link-${provider}`}
            size={ButtonLinkSize.Inherit}
            href={SECURITY_PROVIDER_CONFIG[provider]?.url}
            externalLink
          >
            {t(SECURITY_PROVIDER_CONFIG[provider]?.tKeyName)}
          </ButtonLink>,
        ])}
      </Text>
    </Box>
  );
}
