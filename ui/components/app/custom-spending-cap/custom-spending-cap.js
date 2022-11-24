import React, { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import FormField from '../../ui/form-field';
import Typography from '../../ui/typography';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  TEXT_ALIGN,
  FONT_WEIGHT,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';
import { getCustomTokenAmount } from '../../../selectors';
import { setCustomTokenAmount } from '../../../ducks/app/app';
import { CustomSpendingCapTooltip } from './custom-spending-cap-tooltip';

export default function CustomSpendingCap({
  tokenName,
  currentTokenBalance,
  dappProposedValue,
  siteOrigin,
  passTheErrorText,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const value = useSelector(getCustomTokenAmount);

  const [error, setError] = useState('');
  const [showUseDefaultButton, setShowUseDefaultButton] = useState(
    value !== String(dappProposedValue) && true,
  );
  const inputLogicEmptyStateText = t('inputLogicEmptyState');

  const getInputTextLogic = (inputNumber) => {
    if (Number(inputNumber) <= currentTokenBalance) {
      return {
        className: 'custom-spending-cap__lowerValue',
        description: t('inputLogicEqualOrSmallerNumber', [
          <Typography
            key="custom-spending-cap"
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className="custom-spending-cap__input-value-and-token-name"
          >
            {inputNumber} {tokenName}
          </Typography>,
        ]),
      };
    } else if (Number(inputNumber) > currentTokenBalance) {
      return {
        className: 'custom-spending-cap__higherValue',
        description: t('inputLogicHigherNumber'),
      };
    }
    return {
      className: 'custom-spending-cap__emptyState',
      description: t('inputLogicEmptyState'),
    };
  };

  const [customSpendingCapText, setCustomSpendingCapText] = useState(
    getInputTextLogic(value).description,
  );

  const handleChange = (valueInput) => {
    let spendingCapError = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;
    const inputError =
      typeof valueInput === 'string' && valueInput.charAt(0) === '.';

    if (Number(valueInput) < 0 || isNaN(valueInput) || inputError) {
      spendingCapError = t('spendingCapError');
      setCustomSpendingCapText(t('spendingCapErrorDescription', [siteOrigin]));
      setError(spendingCapError);
    } else {
      setCustomSpendingCapText(inputTextLogicDescription);
      setError('');
    }

    dispatch(setCustomTokenAmount(String(valueInput)));
  };

  useEffect(() => {
    if (value !== String(dappProposedValue)) {
      setShowUseDefaultButton(true);
    }
  }, [value, dappProposedValue]);

  useEffect(() => {
    passTheErrorText(error);
  }, [error, passTheErrorText]);

  const chooseTooltipContentText =
    Number(value) > currentTokenBalance
      ? t('warningTooltipText', [
          <Typography
            key="tooltip-text"
            variant={TYPOGRAPHY.H7}
            fontWeight={FONT_WEIGHT.BOLD}
            color={COLORS.ERROR_DEFAULT}
          >
            <i className="fa fa-exclamation-circle" /> {t('beCareful')}
          </Typography>,
        ])
      : t('inputLogicEmptyState');

  return (
    <>
      <Box
        textAlign={TEXT_ALIGN.END}
        className="custom-spending-cap__max-button"
      >
        <button
          className="custom-spending-cap__input--max-button"
          type="link"
          onClick={(e) => {
            e.preventDefault();
            handleChange(currentTokenBalance);
          }}
        >
          {t('max')}
        </button>
      </Box>
      <Box
        className="custom-spending-cap"
        borderRadius={SIZES.SM}
        paddingTop={2}
        paddingRight={6}
        paddingLeft={6}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.FLEX_START}
        flexDirection={FLEX_DIRECTION.COLUMN}
        backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        gap={2}
      >
        <Box
          justifyContent={JUSTIFY_CONTENT.CENTER}
          display={DISPLAY.BLOCK}
          className="custom-spending-cap__input"
        >
          <label
            htmlFor={
              Number(value) > (currentTokenBalance || error)
                ? 'custom-spending-cap-input-value'
                : 'custom-spending-cap'
            }
          >
            <FormField
              dataTestId="custom-spending-cap-input"
              autoFocus
              wrappingLabelProps={{ as: 'div' }}
              id={
                Number(value) > (currentTokenBalance || error)
                  ? 'custom-spending-cap-input-value'
                  : 'custom-spending-cap'
              }
              TooltipCustomComponent={
                <CustomSpendingCapTooltip
                  tooltipContentText={value ? chooseTooltipContentText : ''}
                  tooltipIcon={value ? Number(value) > currentTokenBalance : ''}
                />
              }
              onChange={handleChange}
              titleText={t('customSpendingCap')}
              placeholder={t('enterANumber')}
              error={error}
              value={value}
              titleDetail={
                showUseDefaultButton && (
                  <button
                    className="custom-spending-cap__input--button"
                    type="link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowUseDefaultButton(false);
                      handleChange(dappProposedValue);
                    }}
                  >
                    {t('useDefault')}
                  </button>
                )
              }
              titleDetailWrapperProps={{ marginBottom: 2, marginRight: 0 }}
            />
            <Typography
              className="custom-spending-cap__description"
              color={COLORS.TEXT_DEFAULT}
              variant={TYPOGRAPHY.H7}
              boxProps={{ paddingTop: 2, paddingBottom: 2 }}
            >
              {value ? customSpendingCapText : inputLogicEmptyStateText}
            </Typography>
          </label>
        </Box>
      </Box>
    </>
  );
}

CustomSpendingCap.propTypes = {
  /**
   * Displayed the token name currently tracked in description related to the input state
   */
  tokenName: PropTypes.string,
  /**
   * The current token balance of the token
   */
  currentTokenBalance: PropTypes.number,
  /**
   * The dapp suggested amount
   */
  dappProposedValue: PropTypes.string,
  /**
   * The origin of the site generally the URL
   */
  siteOrigin: PropTypes.string,
  /**
   * Parent component's callback function passed in order to get the error text
   */
  passTheErrorText: PropTypes.func,
};
