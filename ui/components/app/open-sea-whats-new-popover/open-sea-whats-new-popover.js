import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import {
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Button from '../../ui/button';
import Box from '../../ui/box';
import {
  setOpenSeaTransactionSecurityProviderPopoverHasBeenShown,
  setTransactionSecurityCheckEnabled,
} from '../../../store/actions';
import { getHasTheOpenSeaTransactionSecurityProviderPopoverBeenShown } from '../../../selectors';
import { Text } from '../../component-library';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';

export default function OpenSeaWhatsNewPopover() {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();

  const hasThePopoverBeenShown = useSelector(
    getHasTheOpenSeaTransactionSecurityProviderPopoverBeenShown,
  );

  return (
    process.env.TRANSACTION_SECURITY_PROVIDER &&
    !hasThePopoverBeenShown && (
      <Popover
        title={
          <Text
            variant={TextVariant.headingSm}
            color={TextColor.textAlternative}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('staySafeWithOpenSea')}
          </Text>
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
                history.push(
                  `${EXPERIMENTAL_ROUTE}#transaction-security-check`,
                );
              }}
              className="open-sea-whats-new-popover__enable-security-provider-button"
            >
              {t('enableOpenSeaSecurityProvider')}
            </Button>
            <Box marginTop={2}>
              <Text variant={TextVariant.bodySm}>
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
              </Text>
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
          <Text variant={TextVariant.bodySm}>
            {t('getWarningsFromOpenSea')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            marginTop={4}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('openSeaDescription')}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            marginTop={4}
          >
            {t('alwaysBeSureTo')}
          </Text>
        </Box>
      </Popover>
    )
  );
}
