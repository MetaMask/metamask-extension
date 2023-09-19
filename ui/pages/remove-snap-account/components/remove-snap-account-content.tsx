import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  IconSize,
  Text,
} from '../../../components/component-library';
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
import Card from '../../../components/ui/card';
import { RemoveSnapAccountProps } from '../remove-snap-account';

const CreateSnapAccountContent = ({
  snapName,
  snapId,
  publicAddress,
}: RemoveSnapAccountProps) => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        paddingLeft={4}
        paddingRight={4}
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
          {t('removeSnapAccountTitle')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('removeSnapAccountDescription', [snapName])}
        </Text>
        <Box paddingTop={4} paddingBottom={4}>
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            description={t('removeSnapAccountBannerDescription')}
          />
        </Box>
        <Box>
          <Card>
            <Text variant={TextVariant.bodyMd}>{t('publicAddress')}</Text>
            <Text variant={TextVariant.bodyMd}>{publicAddress}</Text>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
