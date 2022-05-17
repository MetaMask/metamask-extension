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
import { setCollectiblesDetectionNoticeDismissed } from '../../../store/actions';

export default function CollectiblesDetectionNotice() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="collectibles-detection-notice">
      <Dialog type="message" className="collectibles-detection-notice__message">
        <button
          onClick={() => setCollectiblesDetectionNoticeDismissed()}
          className="fas fa-times collectibles-detection-notice__message__close-button"
          data-testid="collectibles-detection-notice-close"
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
              onClick={() => {
                history.push(EXPERIMENTAL_ROUTE);
              }}
              className="collectibles-detection-notice__message__link"
            >
              {t('selectNFTPrivacyPreference')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
