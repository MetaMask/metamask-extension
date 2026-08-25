import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

type PermissionItemProps = {
  icon: IconName;
  iconColor: IconColor;
  children: React.ReactNode;
};

const PermissionItem = ({ icon, iconColor, children }: PermissionItemProps) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    gap={2}
    paddingBottom={1}
  >
    <Icon name={icon} size={IconSize.Md} color={iconColor} />
    <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
      {children}
    </Text>
  </Box>
);

export const ConnectionPermissionsList = () => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('permissions')}
      </Text>
      <PermissionItem
        icon={IconName.Check}
        iconColor={IconColor.SuccessDefault}
      >
        {t('permissionSeeAddresses')}
      </PermissionItem>
      <PermissionItem
        icon={IconName.Check}
        iconColor={IconColor.SuccessDefault}
      >
        {t('permissionSendRequests')}
      </PermissionItem>
      <PermissionItem icon={IconName.Close} iconColor={IconColor.ErrorDefault}>
        {t('permissionCannotMoveFunds')}
      </PermissionItem>
    </Box>
  );
};
