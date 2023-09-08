import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
  FlexDirection,
  Display,
} from '../../../../../helpers/constants/design-system';
import {
  Text,
  AvatarIcon,
  Box,
  IconName,
  AvatarIconSize,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const CreateSnapAccountSuccess = () => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BlockSize.Full}
      padding={2}
    >
      <AvatarIcon
        iconName={IconName.Check}
        color={IconColor.successDefault}
        backgroundColor={BackgroundColor.successMuted}
        size={AvatarIconSize.Xl}
        marginBottom={4}
        iconProps={{ name: IconName.Check, color: IconColor.successDefault }}
      />
      <Text variant={TextVariant.headingLg}>{t('snapAccountCreated')}</Text>
      <Text textAlign={TextAlign.Center}>
        {t('snapAccountCreatedDescription')}
      </Text>
    </Box>
  );
};

export default CreateSnapAccountSuccess;
