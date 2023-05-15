import React from 'react';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Dialog from '../../ui/dialog';
import { Text } from '../../component-library';
import {
  TextVariant,
  TextAlign,
  FontWeight,
  DISPLAY,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../ui/button';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import { Icon, IconName } from '../../component-library';

export default function NftsDetectionNotice() {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="nfts-detection-notice">
      <Dialog type="message" className="nfts-detection-notice__message">
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={1}>
            <Icon
              name={IconName.Info}
              className="info-circle"
              color={IconColor.primaryDefault}
            />
          </Box>
          <Box paddingLeft={2}>
            <Text
              color={TextColor.textDefault}
              align={TextAlign.Left}
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
            >
              {t('newNFTsDetected')}
            </Text>
            <Text
              color={TextColor.textDefault}
              align={TextAlign.Left}
              variant={TextVariant.bodySm}
              as="h6"
              marginBottom={4}
            >
              {t('newNFTDetectedMessage')}
            </Text>
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
