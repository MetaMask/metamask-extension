import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AvatarAccount,
  AvatarAccountVariant,
  AvatarAccountSize,
  Box,
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ListItem,
} from '@metamask/design-system-react';
import { setAvatarType } from '../../../store/actions';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { transitionBack } from '../../../components/ui/transition';
import { useDispatch } from '../../../store/hooks';
import { AVATAR_OPTIONS } from './account-identicon-utils';

const AccountIdenticonSubPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { avatarType } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const currentVariant: AvatarAccountVariant =
    avatarType ?? AvatarAccountVariant.Maskicon;

  const handleSelect = (value: AvatarAccountVariant) => {
    dispatch(setAvatarType(value));
    transitionBack(() => navigate(-1));
  };

  return (
    <Box data-testid="account-identicon-list">
      {AVATAR_OPTIONS.map(({ value, labelKey }) => {
        const isSelected = value === currentVariant;
        return (
          <ListItem
            key={value}
            variant={ContentVariant.OneLine}
            isInteractive
            onClick={() => handleSelect(value)}
            className={
              isSelected
                ? 'bg-muted hover:bg-muted-hover'
                : 'bg-background-default hover:bg-background-default-hover'
            }
            data-testid={`account-identicon-option-${value}`}
            avatar={
              <AvatarAccount
                address={selectedAccount?.address}
                variant={value}
                size={AvatarAccountSize.Md}
              />
            }
            title={t(labelKey)}
            endAccessory={
              isSelected ? (
                <Icon
                  name={IconName.Check}
                  size={IconSize.Md}
                  color={IconColor.IconDefault}
                />
              ) : undefined
            }
          />
        );
      })}
    </Box>
  );
};

export default AccountIdenticonSubPage;
