import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import {
  Box,
  Text,
  ButtonBase,
  ButtonBaseSize,
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
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../helpers/constants/design-system';

type ServiceContactEntry = {
  name: string;
  contactUrl: string;
};

const getServiceContacts = (state: {
  metamask: { serviceContacts?: ServiceContactEntry[] };
}): ServiceContactEntry[] => state.metamask.serviceContacts ?? [];

// eslint-disable-next-line @typescript-eslint/naming-convention
function ContactUrlRow({ entry }: { entry: ServiceContactEntry }) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={1}
      paddingBottom={2}
    >
      <Text variant={TextVariant.bodyMdBold}>{entry.name}</Text>
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
          {entry.contactUrl}
        </Text>
        <ButtonBase
          onClick={() => handleCopy(entry.contactUrl)}
          size={ButtonBaseSize.Sm}
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
    </Box>
  );
}

export default function OcapKernelPage() {
  const t = useI18nContext();
  const serviceContacts = useSelector(getServiceContacts);

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
        <Text variant={TextVariant.bodyMdBold}>
          {t('serviceContactUrls') ?? 'Service contact URLs'}
        </Text>

        {serviceContacts.length > 0 ? (
          serviceContacts.map((entry) => (
            <ContactUrlRow key={entry.name} entry={entry} />
          ))
        ) : (
          <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
            {t('notAvailable')}
          </Text>
        )}
      </Box>
    </Box>
  );
}
