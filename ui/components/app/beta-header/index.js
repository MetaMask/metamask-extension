import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../ui/box/box';
import {
  Color,
  BLOCK_SIZES,
  DISPLAY,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { BETA_BUGS_URL } from '../../../helpers/constants/beta';

import { hideBetaHeader } from '../../../store/actions';
import { Text } from 'ui/components/component-library';

const BetaHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      display={DISPLAY.FLEX}
      width={BLOCK_SIZES.FULL}
      backgroundColor={Color.warningDefault}
      padding={2}
      className="beta-header"
    >
      <Text
        variant={TextVariant.bodySm}
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
      <button
        className="beta-header__button"
        data-testid="beta-header-close"
        onClick={() => {
          hideBetaHeader();
        }}
        aria-label={t('close')}
      >
        <i className="fa fa-times" />
      </button>
    </Box>
  );
};

export default BetaHeader;
