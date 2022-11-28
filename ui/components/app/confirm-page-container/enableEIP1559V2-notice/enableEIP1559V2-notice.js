import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Box from '../../../ui/box';
import Dialog from '../../../ui/dialog';
import Typography from '../../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  FONT_WEIGHT,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Button from '../../../ui/button';
import { EXPERIMENTAL_ROUTE } from '../../../../helpers/constants/routes';
import { setEnableEIP1559V2NoticeDismissed } from '../../../../store/actions';
import { getEnableEIP1559V2NoticeDismissed } from '../../../../ducks/metamask/metamask';
import { getEIP1559V2Enabled } from '../../../../selectors';

export default function EnableEIP1559V2Notice() {
  const t = useI18nContext();
  const history = useHistory();
  const enableEIP1559V2NoticeDismissed = useSelector(
    getEnableEIP1559V2NoticeDismissed,
  );
  const eip1559V2Enabled = useSelector(getEIP1559V2Enabled);

  if (eip1559V2Enabled || enableEIP1559V2NoticeDismissed) {
    return null;
  }

  return (
    <Box margin={4} className="enableEIP1559V2-notice">
      <Dialog type="message" className="enableEIP1559V2-notice__dialog">
        <button
          onClick={setEnableEIP1559V2NoticeDismissed}
          className="enableEIP1559V2-notice__close-button"
          data-testid="enableEIP1559V2-notice-close"
        >
          <i className="fa fa-times enableEIP1559V2-notice__close-button__icon" />
        </button>
        <Box display={DISPLAY.FLEX}>
          <Box paddingTop={1}>
            <i className="fa fa-info-circle" />
          </Box>
          <Box paddingLeft={2}>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H7}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('enableEIP1559V2Header')}
            </Typography>
            <Typography
              color={COLORS.TEXT_DEFAULT}
              align={TEXT_ALIGN.LEFT}
              variant={TYPOGRAPHY.H7}
              boxProps={{ marginBottom: 2 }}
              tag="p"
            >
              {t('enableEIP1559V2AlertMessage')}
            </Typography>
            <Button
              type="inline"
              onClick={() => {
                history.push(EXPERIMENTAL_ROUTE);
              }}
              className="enableEIP1559V2-notice__link"
            >
              {t('enableEIP1559V2ButtonText')}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
