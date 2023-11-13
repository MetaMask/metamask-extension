import React from 'react';
import { Box, IconSize, Text } from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import SnapAvatar from '../../../components/app/snaps/snap-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CreateSnapAccountProps } from '../create-snap-account';

const CreateSnapAccountContent = ({
  snapName,
  snapId,
}: CreateSnapAccountProps) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <Box paddingBottom={2}>
          <SnapAvatar
            snapId={snapId}
            badgeSize={IconSize.Md}
            avatarSize={IconSize.Xl}
            borderWidth={3}
          />
        </Box>
        <Text
          data-testid="create-snap-account-content-title"
          textAlign={TextAlign.Center}
          variant={TextVariant.headingLg}
        >
          {t('createSnapAccountTitle')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          padding={[0, 4]}
          overflowWrap={OverflowWrap.Anywhere}
          data-testid="create-snap-account-content-description"
        >
          {t('createSnapAccountDescription', [snapName])}
        </Text>
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
