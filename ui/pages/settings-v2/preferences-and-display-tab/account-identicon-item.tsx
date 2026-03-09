import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AvatarAccount,
  AvatarAccountVariant,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  FontWeight,
  TextColor,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ACCOUNT_IDENTICON_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../selectors';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { SettingsSelectItem } from '../shared';
import { AVATAR_LABEL_MAP, getAvatarVariant } from './account-identicon-utils';

export const AccountIdenticonItem = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { avatarType, useBlockie } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const handlePress = () => {
    navigate(ACCOUNT_IDENTICON_ROUTE);
  };

  const currentVariant = getAvatarVariant(
    avatarType as AvatarAccountVariant | undefined,
    useBlockie,
  );
  const labelKey = AVATAR_LABEL_MAP[currentVariant];

  return (
    <SettingsSelectItem
      label={t('accountIdenticon')}
      value={
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <AvatarAccount
            address={selectedAccount?.address}
            variant={currentVariant}
            size={AvatarAccountSize.Sm}
          />
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {t(labelKey)}
          </Text>
        </Box>
      }
      onPress={handlePress}
      ariaLabel={t('accountIdenticon')}
    />
  );
};
