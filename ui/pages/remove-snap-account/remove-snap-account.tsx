import React from 'react';
import { useSelector } from 'react-redux';
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
  BorderRadius,
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
import { getMetaMaskAccountsOrdered } from '../../selectors';
import { AccountListItem } from '../../components/multichain/account-list-item/account-list-item';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header';

export interface RemoveSnapAccountProps {
  snapId: string;
  snapName: string;
  publicAddress: string;
}

const RemoveSnapAccount = ({
  snapId,
  snapName,
  publicAddress,
}: RemoveSnapAccountProps) => {
  const t = useI18nContext();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const account = accounts.find((account) => account.address === publicAddress);
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
            <Box
              borderRadius={BorderRadius.LG}
              marginTop={4}
              marginBottom={4}
              width={BlockSize.Full}
              style={{
                boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
              }}
            >
              <AccountListItem identity={account} selected={true} />
            </Box>
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
