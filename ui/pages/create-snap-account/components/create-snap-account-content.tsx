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

interface CreateSnapAccountContentProps {
  snapName: string;
  snapId: string;
}

const CreateSnapAccountContent = ({
  snapName,
  snapId,
}: CreateSnapAccountContentProps) => {
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
        <Text textAlign={TextAlign.Center} variant={TextVariant.headingLg}>
          {t('createSnapAccountTitle')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          padding={[0, 4]}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('createSnapAccountDescription', [snapName])}
        </Text>
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
