import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

import {
  TextVariant,
  Color,
  BlockSize,
  Display,
  AlignItems,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { BETA_BUGS_URL } from '../../../helpers/constants/beta';

import { hideBetaHeader } from '../../../store/actions';

import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  Box,
} from '../../component-library';

const BetaHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      display={Display.Flex}
      width={BlockSize.Full}
      backgroundColor={Color.warningDefault}
      padding={2}
      className="beta-header"
      alignItems={AlignItems.center}
    >
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        className="beta-header__message"
        color={TextColor.warningInverse}
      >
        {t('betaHeaderText', [
          <a
            href={BETA_BUGS_URL}
            key="link"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('here')}
          </a>,
        ])}
      </Text>
      <ButtonIcon
        iconName={IconName.Close}
        size={ButtonIconSize.Sm}
        color={IconColor.warningInverse}
        className="beta-header__button"
        data-testid="beta-header-close"
        onClick={() => {
          hideBetaHeader();
        }}
        aria-label={t('close')}
      />
    </Box>
  );
};

export default BetaHeader;
