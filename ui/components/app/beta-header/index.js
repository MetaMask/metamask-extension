import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../ui/box/box';
import Typography from '../../ui/typography/typography';
import {
  TYPOGRAPHY,
  COLORS,
  BLOCK_SIZES,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { BETA_BUGS_URL } from '../../../helpers/constants/beta';

import { getShowBetaHeader } from '../../../selectors';
import { hideBetaHeader } from '../../../store/actions';

const BetaHomeHeader = () => {
  const t = useI18nContext();
  const showBetaHeader = useSelector(getShowBetaHeader);

  if (!showBetaHeader) {
    return null;
  }

  return (
    <Box
      display={DISPLAY.FLEX}
      width={BLOCK_SIZES.FULL}
      backgroundColor={COLORS.WARNING_DEFAULT}
      padding={2}
      className="beta-header"
    >
      <Typography
        variant={TYPOGRAPHY.H7}
        marginTop={0}
        marginBottom={0}
        className="beta-header__message"
        color={COLORS.WARNING_INVERSE}
      >
        {t('betaHomeHeaderText', [
          <a href={BETA_BUGS_URL} key="link" target="_blank" rel="noreferrer">
            {t('here')}
          </a>,
        ])}
      </Typography>
      <button
        className="beta-header__button"
        onClick={() => {
          hideBetaHeader();
        }}
      >
        <i className="fa fa-times" />
      </button>
    </Box>
  );
};

export default BetaHomeHeader;
