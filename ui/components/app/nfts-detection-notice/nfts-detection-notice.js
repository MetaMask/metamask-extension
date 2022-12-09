import React from 'react';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Dialog from '../../ui/dialog';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  FONT_WEIGHT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../ui/button';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import { setNftsDetectionNoticeDismissed } from '../../../store/actions';

export default function NftsDetectionNotice() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="nfts-detection-notice">
      <Dialog type="message" className="nfts-detection-notice__message">
        <button
          onClick={() => setNftsDetectionNoticeDismissed()}
          className="fas fa-times nfts-detection-notice__message__close-button"
          data-testid="nfts-detection-notice-close"
        />
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={1}>
            <i
              style={{
                fontSize: '1rem',
                color: 'var(--color-primary-default)',
              }}
              className="fa fa-info-circle"
            />
          </Box>
          <Box paddingLeft={2}>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('newNFTsDetected')}
            </Typography>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H7}
              boxProps={{ marginBottom: 4 }}
            >
              {t('newNFTDetectedMessage')}
            </Typography>
            <Button
              type="link"
              onClick={(e) => {
                e.preventDefault();
                history.push(`${EXPERIMENTAL_ROUTE}#autodetect-nfts`);
              }}
              className="nfts-detection-notice__message__link"
            >
              {t('selectNFTPrivacyPreference')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
