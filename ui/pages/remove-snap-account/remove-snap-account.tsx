import React from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  IconName,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header';
import { SnapAccountCard } from './snap-account-card';

export type RemoveSnapAccountProps = {
  snapId: string;
  snapName: string;
  publicAddress: string;
};

const RemoveSnapAccount = ({
  snapId,
  publicAddress,
}: RemoveSnapAccountProps) => {
  const t = useI18nContext();
  return (
    <Box
      className="remove-snap-account-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      marginBottom={0}
    >
      <SnapAuthorshipHeader snapId={snapId} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        paddingLeft={4}
        paddingRight={4}
        style={{ flexGrow: 1 }}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
          >
            <Box paddingBottom={2}>
              <AvatarIcon
                iconName={IconName.UserCircleRemove}
                color={IconColor.errorDefault}
                backgroundColor={BackgroundColor.errorMuted}
                size={AvatarIconSize.Xl}
              />
            </Box>
            <Text textAlign={TextAlign.Center} variant={TextVariant.headingLg}>
              {t('removeSnapAccountTitle')}
            </Text>
            <SnapAccountCard address={publicAddress} remove={true} />
            <Text
              variant={TextVariant.bodyMd}
              textAlign={TextAlign.Center}
              overflowWrap={OverflowWrap.Anywhere}
            >
              {t('removeSnapAccountDescription')}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RemoveSnapAccount;
