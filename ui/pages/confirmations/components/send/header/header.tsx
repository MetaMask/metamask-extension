import React, { useCallback } from 'react';

import {
  AlignItems,
  Display,
  JustifyContent,
  TextVariant,
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
import { useAnimatedExit } from '../../../../../components/ui/animated';

export const Header = () => {
  const t = useI18nContext();
  const { goToPreviousPage } = useNavigateSendPage();
  const triggerExit = useAnimatedExit();

  const handleBack = useCallback(() => {
    triggerExit(goToPreviousPage);
  }, [triggerExit, goToPreviousPage]);

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
        onClick={handleBack}
        size={ButtonIconSize.Sm}
      />
      <Text variant={TextVariant.headingSm}>{t('send')}</Text>
    </Box>
  );
};
