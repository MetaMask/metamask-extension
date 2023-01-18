import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Button from '../../ui/button';
import Box from '../../ui/box';
import {
  setOpenSeaTransactionSecurityProviderPopoverHasBeenShown,
  setTransactionSecurityCheckEnabled,
} from '../../../store/actions';
import { getHasTheOpenSeaTransactionSecurityProviderPopoverBeenShown } from '../../../selectors';

export default function OpenSeaWhatsNewPopover() {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const hasThePopoverBeenShown = useSelector(
    getHasTheOpenSeaTransactionSecurityProviderPopoverBeenShown,
  );

  return (
    process.env.TRANSACTION_SECURITY_PROVIDER &&
    !hasThePopoverBeenShown && (
      <Popover
        title={
          <Typography
            variant={TYPOGRAPHY.H4}
            color={COLORS.TEXT_ALTERNATIVE}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('staySafeWithOpenSea')}
          </Typography>
        }
        footer={
          <>
            <Button
              type="primary"
              onClick={() => {
                dispatch(setTransactionSecurityCheckEnabled(true));
                dispatch(
                  setOpenSeaTransactionSecurityProviderPopoverHasBeenShown(),
                );
              }}
              className="open-sea-whats-new-popover__enable-security-provider-button"
            >
              {t('enableOpenSeaSecurityProvider')}
            </Button>
            <Box marginTop={2}>
              <Typography variant={TYPOGRAPHY.H6}>
                <Button
                  type="link"
                  onClick={() =>
                    dispatch(
                      setOpenSeaTransactionSecurityProviderPopoverHasBeenShown(),
                    )
                  }
                >
                  {t('notNow')}
                </Button>
              </Typography>
            </Box>
          </>
        }
        footerClassName="smart-transactions-popover__footer"
        className="smart-transactions-popover"
        onClose={() =>
          dispatch(setOpenSeaTransactionSecurityProviderPopoverHasBeenShown())
        }
      >
        <Box
          paddingRight={6}
          paddingLeft={6}
          paddingTop={0}
          paddingBottom={0}
          display={DISPLAY.FLEX}
          className="smart-transactions-popover__content"
        >
          <Box
            marginTop={1}
            marginBottom={1}
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <img
              src="./images/open-sea-security-provider.svg"
              alt={t('openSeaAltText')}
            />
          </Box>
          <Typography variant={TYPOGRAPHY.H6}>
            {t('getWarningsFromOpenSea')}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.H6}
            marginTop={4}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('openSeaDescription')}
          </Typography>
          <Typography
            variant={TYPOGRAPHY.H7}
            color={COLORS.TEXT_ALTERNATIVE}
            marginTop={4}
          >
            {t('alwaysBeSureTo')}
          </Typography>
        </Box>
      </Popover>
    )
  );
}
