import React from 'react';
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

export default function NewCollectiblesNotice() {
  const t = useI18nContext();

  return (
    <Box marginBottom={8}>
      <Dialog type="message">
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={2}>
            <i style={{ fontSize: '1rem' }} className="fa fa-info-circle" />
          </Box>
          <Box paddingLeft={4}>
            <Typography
              color={COLORS.BLACK}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.Paragraph}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('newNFTsDetected')}
            </Typography>
            <Typography
              color={COLORS.BLACK}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.Paragraph}
              boxProps={{ marginBottom: 4 }}
            >
              {t('newNFTsDetectedInfo')}
            </Typography>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                console.log('show preference popover');
              }}
              style={{ fontSize: '.9rem' }}
            >
              {t('selectNFTPrivacyPreference')}
            </a>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
