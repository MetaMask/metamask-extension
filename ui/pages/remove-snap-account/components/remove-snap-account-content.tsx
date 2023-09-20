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
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import SnapAvatar from '../../../components/app/snaps/snap-avatar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Card from '../../../components/ui/card';
import { RemoveSnapAccountProps } from '../remove-snap-account';
import ViewAccountOnBlockExplorer from './view-account-on-block-explorer';

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
        <Card display={Display.Flex} gap={4}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text color={TextColor.textMuted} variant={TextVariant.bodySm}>
              {t('publicAddress')}
            </Text>
            <Text variant={TextVariant.bodyXs}>{publicAddress}</Text>
          </Box>
          <Box
            display={Display.Flex}
            marginLeft={'auto'}
            alignItems={AlignItems.center}
          >
            <ViewAccountOnBlockExplorer publicAddress={publicAddress} />
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
