import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import {
  Box,
  Text,
  ButtonBase,
  Icon,
  IconName,
  IconSize,
} from '../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  BlockSize,
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../helpers/constants/design-system';

const getCapabilityVendorUrl = (state: {
  metamask: { capabilityVendorUrl: string | null };
}) => state.metamask.capabilityVendorUrl;

export default function OcapKernelPage() {
  const t = useI18nContext();
  const capabilityVendorUrl = useSelector(getCapabilityVendorUrl);
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  return (
    <Box
      padding={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
    >
      <Text variant={TextVariant.headingMd}>{t('ocapKernel')}</Text>

      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
        padding={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
      >
        <Text variant={TextVariant.bodyMdBold}>{t('capabilityVendorUrl')}</Text>

        {capabilityVendorUrl ? (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            gap={2}
          >
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              ellipsis
              style={{ flex: 1, minWidth: 0 }}
            >
              {capabilityVendorUrl}
            </Text>
            <ButtonBase
              onClick={() => handleCopy(capabilityVendorUrl)}
              size={BlockSize.Min}
              backgroundColor={BackgroundColor.transparent}
              title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            >
              <Icon
                name={copied ? IconName.CopySuccess : IconName.Copy}
                size={IconSize.Sm}
                color={IconColor.iconDefault}
              />
            </ButtonBase>
          </Box>
        ) : (
          <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
            {t('notAvailable')}
          </Text>
        )}
      </Box>
    </Box>
  );
}
