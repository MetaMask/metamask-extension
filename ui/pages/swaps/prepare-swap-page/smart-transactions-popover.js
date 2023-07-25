import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import Button from '../../../components/ui/button';
import Box from '../../../components/ui/box';
import Popover from '../../../components/ui/popover';
import Typography from '../../../components/ui/typography';
import {
  TypographyVariant,
  DISPLAY,
  TextVariant,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Text } from '../../../components/component-library';
import PopoverCustomBackground from '../popover-custom-background/popover-custom-background';

export default function SmartTransactionsPopover({
  onEnableSmartTransactionsClick,
  onCloseSmartTransactionsOptInPopover,
}) {
  const t = useContext(I18nContext);
  return (
    <Popover
      title={t('smartSwapsAreHere')}
      footer={
        <>
          <Button type="primary" onClick={onEnableSmartTransactionsClick}>
            {t('enableSmartSwaps')}
          </Button>
          <Box marginTop={1}>
            <Text variant={TextVariant.bodyMd} as="h6">
              <Button
                type="link"
                onClick={onCloseSmartTransactionsOptInPopover}
                className="smart-transactions-popover__no-thanks-link"
              >
                {t('noThanksVariant2')}
              </Button>
            </Text>
          </Box>
        </>
      }
      footerClassName="smart-transactions-popover__footer"
      className="smart-transactions-popover"
      CustomBackground={() => {
        return (
          <PopoverCustomBackground
            onClose={onCloseSmartTransactionsOptInPopover}
          />
        );
      }}
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
          marginTop={0}
          marginBottom={4}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
        >
          <img
            src="./images/logo/smart-transactions-header.png"
            alt={t('swapSwapSwitch')}
          />
        </Box>
        <Typography variant={TypographyVariant.H7} marginTop={0}>
          {t('smartSwapsDescription')}
        </Typography>
        <Typography
          as="ul"
          variant={TypographyVariant.H7}
          fontWeight={FONT_WEIGHT.BOLD}
          marginTop={3}
        >
          <li>{t('stxBenefit1')}</li>
          <li>{t('stxBenefit2')}</li>
          <li>{t('stxBenefit3')}</li>
          <li>
            {t('stxBenefit4')}
            <Typography
              as="span"
              fontWeight={FONT_WEIGHT.NORMAL}
              variant={TypographyVariant.H7}
            >
              {' *'}
            </Typography>
          </li>
        </Typography>
        <Typography
          variant={TypographyVariant.H8}
          color={TextColor.textAlternative}
          boxProps={{ marginTop: 3 }}
        >
          {t('smartSwapsSubDescription')}&nbsp;
          <Typography
            as="span"
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TypographyVariant.H8}
            color={TextColor.textAlternative}
          >
            {t('stxYouCanOptOut')}&nbsp;
          </Typography>
        </Typography>
      </Box>
    </Popover>
  );
}

SmartTransactionsPopover.propTypes = {
  onEnableSmartTransactionsClick: PropTypes.func.isRequired,
  onCloseSmartTransactionsOptInPopover: PropTypes.func.isRequired,
};
