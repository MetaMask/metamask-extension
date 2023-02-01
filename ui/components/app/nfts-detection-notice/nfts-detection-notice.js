import React from 'react';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Dialog from '../../ui/dialog';
import Typography from '../../ui/typography/typography';
import {
  TypographyVariant,
  TEXT_ALIGN,
  FONT_WEIGHT,
  DISPLAY,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../ui/button';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import { Icon, ICON_NAMES } from '../../component-library';

export default function NftsDetectionNotice() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="nfts-detection-notice">
      <Dialog type="message" className="nfts-detection-notice__message">
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={1}>
            <Icon
              name={ICON_NAMES.INFO}
              className="info-circle"
              color={IconColor.primaryDefault}
            />
          </Box>
          <Box paddingLeft={2}>
            <Typography
              color={TextColor.textDefault}
              align={TEXT_ALIGN.LEFT}
              variant={TypographyVariant.H7}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('newNFTsDetected')}
            </Typography>
            <Typography
              color={TextColor.textDefault}
              align={TEXT_ALIGN.LEFT}
              variant={TypographyVariant.H7}
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
