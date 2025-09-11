import React from 'react';

import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';

export const Header = () => {
  const t = useI18nContext();
  const { goToPreviousPage } = useNavigateSendPage();

  return (
    <Box
      alignItems={AlignItems.center}
      className="send-header__wrapper"
      display={Display.Flex}
      justifyContent={JustifyContent.center}
    >
      <ButtonIcon
        ariaLabel="go to previous page"
        className="send-header__previous-btn"
        iconName={IconName.ArrowLeft}
        onClick={goToPreviousPage}
        size={ButtonIconSize.Sm}
      />
      <Text>{t('send')}</Text>
    </Box>
  );
};
