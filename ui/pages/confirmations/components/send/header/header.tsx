import React, { useCallback } from 'react';

import {
  AlignItems,
  Display,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../../components/component-library/box/box';
import { ButtonIcon } from '../../../../../components/component-library/button-icon/button-icon';
import { ButtonIconSize } from '../../../../../components/component-library/button-icon/button-icon.types';
import { IconName } from '../../../../../components/component-library/icon/icon.types';
import { Text } from '../../../../../components/component-library/text/text';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { transitionBack } from '../../../../../components/ui/transition';

export const Header = () => {
  const t = useI18nContext();
  const { goToPreviousPage } = useNavigateSendPage();

  const handleBack = useCallback(() => {
    transitionBack(goToPreviousPage);
  }, [goToPreviousPage]);

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
        size={ButtonIconSize.Md}
      />
      <Text variant={TextVariant.headingSm}>{t('send')}</Text>
    </Box>
  );
};
