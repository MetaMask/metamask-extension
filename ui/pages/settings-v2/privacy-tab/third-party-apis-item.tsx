import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Text,
  TextVariant,
  BoxFlexDirection,
  TextColor,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { THIRD_PARTY_APIS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const ThirdPartyApisItem = () => {
  const t = useI18nContext();

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
        <Link to={THIRD_PARTY_APIS_ROUTE}>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            className="text-icon-alternative"
          />
        </Link>
      </Box>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('thirdPartyApisDescription')}
      </Text>
    </Box>
  );
};
