import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AvatarAccount,
  AvatarAccountVariant,
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
  BoxBackgroundColor,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { setAvatarType } from '../../../store/actions';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { getPreferences } from '../../../selectors';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AVATAR_OPTIONS, getAvatarVariant } from './account-identicon-utils';

const AccountIdenticonSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { avatarType, useBlockie } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const currentVariant = getAvatarVariant(
    avatarType as AvatarAccountVariant | undefined,
    useBlockie,
  );

  const handleSelect = (value: AvatarAccountVariant) => {
    dispatch(setAvatarType(value));
    navigate(PREFERENCES_AND_DISPLAY_ROUTE);
  };

  return (
    <Box data-testid="account-identicon-list">
      {AVATAR_OPTIONS.map(({ value, labelKey }) => {
        const isSelected = value === currentVariant;
        return (
          <Box
            key={value}
            data-testid={`account-identicon-option-${value}`}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            backgroundColor={
              isSelected
                ? BoxBackgroundColor.BackgroundMuted
                : BoxBackgroundColor.BackgroundDefault
            }
            className="w-full cursor-pointer border-0 p-4"
            onClick={() => handleSelect(value)}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <AvatarAccount
                address={selectedAccount?.address}
                variant={value}
                size={AvatarAccountSize.Md}
              />
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {t(labelKey)}
              </Text>
            </Box>
            {isSelected && (
              <Icon
                name={IconName.Check}
                size={IconSize.Md}
                color={IconColor.IconDefault}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default AccountIdenticonSubPage;
