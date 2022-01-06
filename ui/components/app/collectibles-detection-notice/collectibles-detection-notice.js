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
    <Box marginBottom={8} className="collectibles-detection-notice">
      <Dialog type="message" className="collectibles-detection-notice__message">
        <button
          onClick={() => setCollectiblesDetectionNoticeDismissed()}
          className="collectibles-detection-notice__message__close-button"
          data-testid="collectibles-detection-notice-close"
        />
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={2}>
            <i style={{ fontSize: '1rem' }} className="fa fa-info-circle" />
          </Box>
          <Box paddingLeft={4}>
            <Typography
              color={COLORS.BLACK}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('newNFTsDetected')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginBottom: 4 }}
            >
              {t('newNFTsDetectedInfo')}
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
