import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../ui/box/box';
import {
  Color,
  BLOCK_SIZES,
  DISPLAY,
  AlignItems,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { BETA_BUGS_URL } from '../../../helpers/constants/beta';

import { hideBetaHeader } from '../../../store/actions';

import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';

const BetaHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      display={DISPLAY.FLEX}
      width={BLOCK_SIZES.FULL}
      backgroundColor={Color.warningDefault}
      padding={2}
      className="beta-header"
      alignItems={AlignItems.center}
    >
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        marginTop={0}
        marginBottom={0}
        className="beta-header__message"
        color={Color.warningInverse}
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
