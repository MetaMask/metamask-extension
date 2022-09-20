import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import Tooltip from '../tooltip';
import Typography from '../typography';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TYPOGRAPHY,
  TEXT_ALIGN,
  SIZES,
} from '../../../helpers/constants/design-system';

export default function ReviewSpendingCap({
  tokenName,
  currentTokenBalance,
  tokenValue,
  onEdit,
}) {
  const t = useContext(I18nContext);

  return (
    <Box
      className="review-spending-cap"
      borderRadius={SIZES.SM}
      paddingTop={4}
      paddingRight={4}
      paddingLeft={4}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      flexDirection={FLEX_DIRECTION.COLUMN}
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      gap={1}
    >
      <Box
        flexDirection={FLEX_DIRECTION.ROW}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        className="review-spending-cap__heading"
      >
        <Box
          flexDirection={FLEX_DIRECTION.ROW}
          className="review-spending-cap__heading-title"
        >
          <Typography
            as={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            variant={TYPOGRAPHY.H6}
            boxProps={{ display: DISPLAY.INLINE_BLOCK }}
          >
            {t('customSpendingCap')}
          </Typography>
          <Box marginLeft={2} display={DISPLAY.INLINE_BLOCK}>
            <Tooltip
              interactive
              position="top"
              html={
                <Typography
                  variant={TYPOGRAPHY.H7}
                  color={COLORS.TEXT_ALTERNATIVE}
                  className="review-spending-cap__heading-title__tooltip"
                >
                  {tokenValue > currentTokenBalance &&
                    t('warningTooltipText', [
                      <Typography
                        key="tooltip-text"
                        variant={TYPOGRAPHY.H7}
                        fontWeight={FONT_WEIGHT.BOLD}
                        color={COLORS.WARNING_DEFAULT}
                      >
                        <i className="fa fa-exclamation-circle" />{' '}
                        {t('beCareful')}
                      </Typography>,
                    ])}
                  {tokenValue === 0 && t('revokeSpendingCapTooltipText')}
                </Typography>
              }
            >
              {tokenValue > currentTokenBalance && (
                <i className="fa fa-exclamation-triangle review-spending-cap__heading-title__tooltip__warning-icon" />
              )}
              {tokenValue === 0 && (
                <i className="far fa-question-circle review-spending-cap__heading-title__tooltip__question-icon" />
              )}
            </Tooltip>
          </Box>
        </Box>
        <Box
          className="review-spending-cap__heading-detail"
          textAlign={TEXT_ALIGN.END}
        >
          <button
            className="review-spending-cap__heading-detail__button"
            type="link"
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
          >
            {t('edit')}
          </button>
        </Box>
      </Box>
      <Box>
        <Typography
          as={TYPOGRAPHY.H6}
          color={
            tokenValue > currentTokenBalance
              ? COLORS.WARNING_DEFAULT
              : COLORS.TEXT_DEFAULT
          }
          variant={TYPOGRAPHY.H6}
          marginBottom={3}
        >
          {tokenValue} {tokenName}
        </Typography>
      </Box>
    </Box>
  );
}

ReviewSpendingCap.propTypes = {
  tokenName: PropTypes.string,
  currentTokenBalance: PropTypes.number,
  tokenValue: PropTypes.number,
  onEdit: PropTypes.func,
};
