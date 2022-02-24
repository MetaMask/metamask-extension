import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';

import classnames from 'classnames';
import { useI18nContext } from '../../../hooks/useI18nContext';
import QrView from '../../../components/ui/qr-code';
import ExportTextContainer from '../../../components/ui/export-text-container';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import {
  DISPLAY,
  JustifyContent,
  FONT_WEIGHT,
  TypographyVariant,
  Color,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';

export default function RevealSeedContent({ seedWords }) {
  const t = useI18nContext();
  const history = useHistory();
  const [showTextViewSRP, setShowTextViewSRP] = useState(true);
  const [tabHasFocus, setTabHasFocus] = useState(true);

  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    const handleFocus = () => {
      setTabHasFocus(true);
    };

    const handleBlur = () => {
      setTabHasFocus(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      trackEvent({
        event: 'Reveal SRP Cancelled',
        category: EVENT.CATEGORIES.SETTINGS,
        properties: {
          action: 'Reveal SRP Cancelled',
        },
      });
    };
  }, [trackEvent]);

  useEffect(() => {
    !tabHasFocus && history.push(DEFAULT_ROUTE);
  }, [history, tabHasFocus]);

  return (
    <Box className="reveal-seed__container">
      <Box display={DISPLAY.FLEX} justifyContent={JustifyContent.spaceAround}>
        <div
          className={classnames('reveal-seed__buttons', {
            'reveal-seed__buttons__active': showTextViewSRP,
          })}
          onClick={() => setShowTextViewSRP(true)}
        >
          <Typography
            variant={TypographyVariant.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className={classnames('reveal-seed__button', {
              'reveal-seed__button__active': showTextViewSRP,
            })}
          >
            {t('text').toUpperCase()}
          </Typography>
        </div>
        <div
          className={classnames('reveal-seed__buttons', {
            'reveal-seed__buttons__active': !showTextViewSRP,
          })}
          onClick={() => setShowTextViewSRP(false)}
        >
          <Typography
            variant={TypographyVariant.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className={classnames('reveal-seed__button', {
              'reveal-seed__button__active': !showTextViewSRP,
            })}
          >
            {t('qrCode').toUpperCase()}
          </Typography>
        </div>
      </Box>
      {showTextViewSRP ? (
        <Box>
          <Typography
            variant={TypographyVariant.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            color={Color.BLACK}
            boxProps={{ marginTop: 4 }}
          >
            {t('yourSecretSeedPhrase')}
          </Typography>
          <ExportTextContainer text={seedWords} />
        </Box>
      ) : (
        <QrView
          Qr={{
            data: seedWords,
            isHexAddress: false,
          }}
        />
      )}
    </Box>
  );
}

RevealSeedContent.propTypes = {
  seedWords: PropTypes.string.isRequired,
};
