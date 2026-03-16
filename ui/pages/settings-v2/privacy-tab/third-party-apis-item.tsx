import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  TextVariant,
  BoxFlexDirection,
  TextColor,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  ButtonIcon,
  IconName,
  ButtonIconSize,
} from '@metamask/design-system-react';
import { THIRD_PARTY_APIS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const ThirdPartyApisItem = () => {
  const navigate = useNavigate();
  const t = useI18nContext();

  const handlePress = () => {
    navigate(THIRD_PARTY_APIS_ROUTE);
  };

  return (
    <Box flexDirection={BoxFlexDirection.Column} paddingVertical={3} gap={1}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('thirdPartyApis')}
        </Text>
        <ButtonIcon
          iconName={IconName.ArrowRight}
          size={ButtonIconSize.Sm}
          className="text-icon-alternative"
          onClick={handlePress}
          ariaLabel={`${t('select')} ${t('thirdPartyApis')}`}
        />
      </Box>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('thirdPartyApisDescription')}
      </Text>
    </Box>
  );
};
