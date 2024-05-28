import React from 'react';
import {
  SECURITY_PROVIDER_CONFIG,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { SizeNumber } from '../../../component-library/box/box.types';
import {
  AlignItems,
  Display,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type AlertProviderProps = {
  provider?: SecurityProvider;
  paddingTop?: SizeNumber;
  textAlign?: TextAlign;
};

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
    <Box paddingTop={paddingTop} textAlign={textAlign}>
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
