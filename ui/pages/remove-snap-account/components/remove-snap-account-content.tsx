import React from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { RemoveSnapAccountProps } from '../remove-snap-account';
import { getMetaMaskAccountsOrdered } from '../../../selectors';
import { useSelector } from 'react-redux';
import { AccountListItem } from '../../../components/multichain';

const CreateSnapAccountContent = ({
  snapName,
  snapId,
  publicAddress,
}: RemoveSnapAccountProps) => {
  const t = useI18nContext();
  const lowerCaseAddress = publicAddress.toLowerCase();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const account = accounts.find(account => account.address === lowerCaseAddress);
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
          <AvatarIcon
            iconName={IconName.UserCircleRemove}
            size={AvatarIconSize.Xl}
          />
        </Box>
        <Text textAlign={TextAlign.Center} variant={TextVariant.headingLg}>
          {t('removeSnapAccountTitle')}
        </Text>
        <AccountListItem identity={account} />
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('removeSnapAccountDescription')}
        </Text>
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
